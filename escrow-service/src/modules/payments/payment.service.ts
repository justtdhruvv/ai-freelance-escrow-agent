import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { RazorpayService } from './razorpay.service';
import { logger } from '../../utils/logger';

export interface PaymentEvent {
  payment_event_id: string;
  project_id: string;
  milestone_id?: string;
  type: 'escrow_hold' | 'milestone_release' | 'prorated_release' | 'refund';
  amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_transfer_id?: string;
  triggered_by: 'aqa_auto' | 'manual' | 'dispute_resolution';
  created_at?: Date | string;
}

export interface CreatePaymentEventInput {
  project_id: string;
  milestone_id?: string;
  type: 'escrow_hold' | 'milestone_release' | 'prorated_release' | 'refund';
  amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_transfer_id?: string;
  triggered_by?: 'aqa_auto' | 'manual' | 'dispute_resolution';
}

export interface PaymentConfirmInput {
  order_id: string;
  payment_id: string;
  razorpay_signature: string;
}

export interface Milestone {
  milestone_id: string;
  project_id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
  created_at?: Date;
}

export interface FreelancerWallet {
  wallet_id: string;
  freelancer_id: string;
  balance: number;
  created_at?: Date;
}

export class PaymentService {
  private razorpayService: RazorpayService;

  constructor() {
    this.razorpayService = new RazorpayService();
  }

  /**
   * Create real escrow order for project funding
   */
  async createEscrowOrder(projectId: string, amount: number): Promise<{
    order_id: string;
    amount: number;
    currency: string;
  }> {
    try {
      // Verify project exists
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Convert amount to paise for Razorpay format
      const amountInPaise = this.razorpayService.convertToPaise(amount);

      // Create real Razorpay order
      const order = await this.razorpayService.createOrder({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `project_${projectId}`,
        notes: {
          project_id: projectId,
          type: 'escrow_hold'
        }
      });

      // Update project with Razorpay order ID
      await this.updateProjectRazorpayOrderId(projectId, order.id);

      logger.info('Real escrow order created', {
        project_id: projectId,
        order_id: order.id,
        amount: amountInPaise
      });

      return {
        order_id: order.id,
        amount: amountInPaise,
        currency: 'INR'
      };
    } catch (error) {
      logger.error('Error creating escrow order', error);
      throw error;
    }
  }

  /**
   * Confirm real payment and update escrow balance
   */
  async confirmPayment(input: PaymentConfirmInput): Promise<PaymentEvent> {
    const { order_id, payment_id, razorpay_signature } = input;

    // Verify payment signature
    const isValidSignature = this.razorpayService.verifyPaymentSignature(
      order_id,
      payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      throw new Error('Invalid payment signature');
    }

    // Fetch payment details from Razorpay
    const payment = await this.razorpayService.fetchPayment(payment_id);
    
    if (payment.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    // Fetch order details to get project_id
    const order = await this.razorpayService.fetchOrder(order_id);
    const projectId = order.notes?.project_id;
    
    if (!projectId) {
      throw new Error('Project ID not found in order notes');
    }

    const trx = await db.transaction();

    try {
      // Convert amount from paise to rupees for database storage
      const amountInRupees = this.razorpayService.convertToRupees(typeof payment.amount === 'string' ? parseInt(payment.amount) : payment.amount);

      // Increase project escrow_balance
      await trx('projects')
        .where({ project_id: projectId })
        .increment('escrow_balance', amountInRupees);

      // Create escrow hold payment event
      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: projectId,
        type: 'escrow_hold',
        amount: amountInRupees,
        razorpay_order_id: order_id,
        razorpay_payment_id: payment_id,
        triggered_by: 'manual'
      });

      // Update project status to active
      await trx('projects')
        .where({ project_id: projectId })
        .update({ status: 'active' });

      await trx.commit();

      logger.info('Real payment confirmed and escrow balance updated', {
        project_id: projectId,
        payment_id: payment_id,
        order_id: order_id,
        amount: amountInRupees
      });

      return paymentEvent;
    } catch (error) {
      await trx.rollback();
      logger.error('Error confirming payment', error);
      throw error;
    }
  }

  /**
   * Release milestone payment to freelancer
   */
  async releaseMilestonePayment(milestoneId: string, triggeredBy: 'aqa_auto' | 'manual' | 'dispute_resolution'): Promise<PaymentEvent> {
    const trx = await db.transaction();

    try {
      // Get milestone details
      const milestone = await trx('milestone_checks')
        .where({ milestone_id: milestoneId })
        .first();

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // Verify milestone is passed
      if (milestone.status !== 'passed') {
        throw new Error('Milestone must be passed before payment can be released');
      }

      // Get project details
      const project = await trx('projects')
        .where({ project_id: milestone.project_id })
        .first();

      if (!project) {
        throw new Error('Project not found');
      }

      // Check project escrow_balance
      if (project.escrow_balance < milestone.amount) {
        throw new Error('Insufficient escrow balance');
      }

      // Get or create freelancer wallet
      let freelancerWallet = await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .first();

      if (!freelancerWallet) {
        // Create freelancer wallet if not exists
        const walletId = uuidv4();
        await trx('freelancer_wallets').insert({
          wallet_id: walletId,
          freelancer_id: project.freelancer_id,
          balance: 0,
          created_at: new Date()
        });

        freelancerWallet = await trx('freelancer_wallets')
          .where({ wallet_id: walletId })
          .first();
      }

      // Convert amount to paise for Razorpay transfer
      const amountInPaise = this.razorpayService.convertToPaise(milestone.amount);

      // Create real Razorpay transfer
      const transfer = await this.razorpayService.createTransfer({
        amount: amountInPaise,
        account_id: project.freelancer_id, // This should be Razorpay account ID
        notes: {
          project_id: milestone.project_id,
          milestone_id: milestoneId,
          type: 'milestone_release'
        }
      });

      // All operations using Knex transactions:

      // 1. Deduct milestone amount from project escrow_balance
      await trx('projects')
        .where({ project_id: milestone.project_id })
        .decrement('escrow_balance', milestone.amount);

      // 2. Increase freelancer_wallet balance
      await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .increment('balance', milestone.amount);

      // 3. Create payment_event milestone_release
      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: milestone.project_id,
        milestone_id: milestoneId,
        type: 'milestone_release',
        amount: milestone.amount,
        razorpay_transfer_id: transfer.id,
        triggered_by: triggeredBy
      });

      // 4. Update PFI score for milestone completion
      await this.updatePfiScore(project.freelancer_id, 'milestone_passed');

      await trx.commit();

      logger.info('Milestone payment released with real Razorpay transfer', {
        milestone_id: milestoneId,
        transfer_id: transfer.id,
        amount: milestone.amount,
        freelancer_id: project.freelancer_id,
        new_wallet_balance: freelancerWallet.balance + milestone.amount
      });

      return paymentEvent;
    } catch (error) {
      await trx.rollback();
      logger.error('Error releasing milestone payment', error);
      throw error;
    }
  }

  /**
   * Update PFI score based on milestone completion
   */
  private async updatePfiScore(freelancerId: string, action: 'milestone_passed' | 'milestone_failed' | 'milestone_delayed'): Promise<void> {
    try {
      let scoreChange = 0;

      switch (action) {
        case 'milestone_passed':
          scoreChange = 10;
          break;
        case 'milestone_failed':
          scoreChange = -15;
          break;
        case 'milestone_delayed':
          scoreChange = -5;
          break;
      }

      await db('users')
        .where({ user_id: freelancerId })
        .increment('pfi_score', scoreChange);

      logger.info('PFI score updated', {
        freelancer_id: freelancerId,
        action: action,
        score_change: scoreChange
      });
    } catch (error) {
      logger.error('Error updating PFI score', error);
      // Don't throw error for PFI update - it's not critical
    }
  }

  /**
   * Create payment event record within transaction
   */
  private async createPaymentEventInTransaction(trx: any, input: CreatePaymentEventInput): Promise<PaymentEvent> {
    const paymentEventId = uuidv4();

    await trx('payment_events')
      .insert({
        payment_event_id: paymentEventId,
        project_id: input.project_id,
        milestone_id: input.milestone_id || null,
        type: input.type,
        amount: input.amount,
        razorpay_order_id: input.razorpay_order_id || null,
        razorpay_payment_id: input.razorpay_payment_id || null,
        razorpay_transfer_id: input.razorpay_transfer_id || null,
        triggered_by: input.triggered_by || 'manual',
        created_at: new Date()
      });

    const paymentEvent = await trx('payment_events')
      .where({ payment_event_id: paymentEventId })
      .first();
    
    if (!paymentEvent) {
      throw new Error('Failed to create payment event');
    }

    return paymentEvent;
  }

  /**
   * Create payment event record
   */
  async createPaymentEvent(input: CreatePaymentEventInput): Promise<PaymentEvent> {
    return this.createPaymentEventInTransaction(db, input);
  }

  // Helper methods for database operations

  async getProjectById(projectId: string): Promise<any> {
    try {
      const project = await db('projects')
        .where({ project_id: projectId })
        .first();
      
      return project || null;
    } catch (error) {
      logger.error('Error fetching project by ID', error);
      throw new Error('Error fetching project');
    }
  }

  async updateProjectRazorpayOrderId(projectId: string, razorpayOrderId: string): Promise<void> {
    try {
      await db('projects')
        .where({ project_id: projectId })
        .update({ razorpay_order_id: razorpayOrderId });
    } catch (error) {
      logger.error('Error updating project Razorpay order ID', error);
      throw new Error('Error updating project');
    }
  }

  async getMilestoneById(milestoneId: string): Promise<Milestone | null> {
    try {
      const milestone = await db('milestone_checks')
        .where({ milestone_id: milestoneId })
        .first();
      
      return milestone || null;
    } catch (error) {
      logger.error('Error fetching milestone by ID', error);
      throw new Error('Error fetching milestone');
    }
  }

  async getFreelancerWallet(freelancerId: string): Promise<FreelancerWallet | null> {
    try {
      const wallet = await db('freelancer_wallets')
        .where({ freelancer_id: freelancerId })
        .first();
      
      return wallet || null;
    } catch (error) {
      logger.error('Error fetching freelancer wallet', error);
      throw new Error('Error fetching freelancer wallet');
    }
  }

  async getPaymentEventsByProject(projectId: string): Promise<PaymentEvent[]> {
    try {
      const paymentEvents = await db('payment_events')
        .where({ project_id: projectId })
        .orderBy('created_at', 'desc');
      
      return paymentEvents;
    } catch (error) {
      logger.error('Error fetching payment events by project', error);
      throw new Error('Error fetching payment events');
    }
  }

  /**
   * Get Razorpay service for testing
   */
  getRazorpayService(): RazorpayService {
    return this.razorpayService;
  }
}
