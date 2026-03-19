import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { MockRazorpayService } from './mockRazorpay.service';
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
  created_at?: Date;
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

export interface MockPaymentConfirmInput {
  order_id: string;
  payment_id: string;
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
  private mockRazorpayService: MockRazorpayService;

  constructor() {
    this.mockRazorpayService = new MockRazorpayService();
  }

  /**
   * Create mock escrow order for project funding
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
      const amountInPaise = MockRazorpayService.convertToPaise(amount);

      // Create mock Razorpay order
      const order = await this.mockRazorpayService.createOrder({
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

      logger.info('Mock escrow order created', {
        project_id: projectId,
        order_id: order.id,
        amount: amountInPaise
      });

      return {
        order_id: order.id,
        amount: amountInPaise,
        currency: order.currency
      };
    } catch (error) {
      logger.error('Error creating mock escrow order', error);
      throw error;
    }
  }

  /**
   * Simulate payment success and increase escrow balance
   * POST /payments/mock-confirm
   */
  async mockPaymentConfirm(input: MockPaymentConfirmInput): Promise<PaymentEvent> {
    const trx = await db.transaction();
    
    try {
      // Verify order exists
      const order = await this.mockRazorpayService.fetchOrder(input.order_id);
      
      // Extract project_id from order notes
      const projectId = order.notes?.project_id;
      if (!projectId) {
        throw new Error('Project ID not found in order');
      }

      // Get project details
      const project = await trx('projects')
        .where({ project_id: projectId })
        .first();

      if (!project) {
        throw new Error('Project not found');
      }

      // Convert amount from paise to rupees for database storage
      const amountInRupees = MockRazorpayService.convertToRupees(order.amount);

      // Increase project escrow_balance using Knex transaction
      await trx('projects')
        .where({ project_id: projectId })
        .increment('escrow_balance', amountInRupees);

      // Create payment event type = escrow_hold
      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: projectId,
        type: 'escrow_hold',
        amount: amountInRupees,
        razorpay_order_id: input.order_id,
        razorpay_payment_id: input.payment_id,
        triggered_by: 'manual'
      });

      // Update project status to active
      await trx('projects')
        .where({ project_id: projectId })
        .update({ status: 'active' });

      await trx.commit();

      logger.info('Mock payment confirmed and escrow balance updated', {
        project_id: projectId,
        order_id: input.order_id,
        payment_id: input.payment_id,
        amount: amountInRupees
      });

      return paymentEvent;
    } catch (error) {
      await trx.rollback();
      logger.error('Error confirming mock payment', error);
      throw error;
    }
  }

  /**
   * Release milestone payment with escrow balance and wallet management
   * POST /milestones/:milestoneId/release
   */
  async releaseMilestonePayment(
    milestoneId: string,
    triggeredBy: 'aqa_auto' | 'manual' | 'dispute_resolution' = 'manual'
  ): Promise<PaymentEvent> {
    const trx = await db.transaction();
    
    try {
      // Get milestone details
      const milestone = await trx('milestone_checks')
        .where({ milestone_id: milestoneId })
        .first();

      if (!milestone) {
        throw new Error('Milestone not found');
      }

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

      // Check project escrow_balance using Knex transaction
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

      // Generate mock transfer ID
      const transferId = this.mockRazorpayService.generateMockTransferId();

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
        razorpay_transfer_id: transferId,
        triggered_by: triggeredBy
      });

      await trx.commit();

      logger.info('Milestone payment released with wallet update', {
        milestone_id: milestoneId,
        transfer_id: transferId,
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
   * Create payment event record (within transaction)
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
   * Create payment event record (public method)
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
   * Get mock Razorpay service for testing
   */
  getMockRazorpayService(): MockRazorpayService {
    return this.mockRazorpayService;
  }
}
