import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
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
  /**
   * Simulate client funding project into escrow — no payment gateway needed
   */
  async simulateFundProject(projectId: string): Promise<PaymentEvent> {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');
    if (!project.total_price || project.total_price <= 0) throw new Error('Project must have a valid total price');
    if (project.status !== 'draft' && project.status !== 'sop_review' && project.status !== 'client_review') {
      throw new Error('Project is already funded or not in a fundable state');
    }

    const trx = await db.transaction();
    try {
      const simOrderId = `sim_order_${uuidv4().substring(0, 16)}`;

      await trx('projects')
        .where({ project_id: projectId })
        .update({
          escrow_balance: project.total_price,
          status: 'active',
          razorpay_order_id: simOrderId
        });

      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: projectId,
        type: 'escrow_hold',
        amount: project.total_price,
        razorpay_order_id: simOrderId,
        triggered_by: 'manual'
      });

      await trx.commit();

      logger.info('Simulated project funding complete', {
        project_id: projectId,
        amount: project.total_price,
        sim_order_id: simOrderId
      });

      return paymentEvent;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Release prorated milestone payment to freelancer (for partial AQA results)
   */
  async releaseProratedPayment(milestoneId: string, passRate: number, triggeredBy: 'aqa_auto' | 'manual' | 'dispute_resolution'): Promise<PaymentEvent> {
    const trx = await db.transaction();

    try {
      // Get milestone details
      const milestone = await trx('milestone_checks')
        .where({ milestone_id: milestoneId })
        .first();

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // Validate pass rate
      if (passRate < 0 || passRate > 1) {
        throw new Error('Pass rate must be between 0 and 1');
      }

      // Get project details
      const project = await trx('projects')
        .where({ project_id: milestone.project_id })
        .first();

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate prorated amount
      const proratedAmount = Math.floor(milestone.payment_amount * passRate);

      if (proratedAmount <= 0) {
        throw new Error('Prorated amount must be greater than 0');
      }

      // Get or create freelancer wallet
      let freelancerWallet = await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .first();

      if (!freelancerWallet) {
        const walletId = uuidv4();
        await trx('freelancer_wallets').insert({
          wallet_id: walletId,
          freelancer_id: project.freelancer_id,
          balance: 0,
          created_at: new Date()
        });
        freelancerWallet = { wallet_id: walletId, freelancer_id: project.freelancer_id, balance: 0 };
      }

      // Update wallet balance with prorated amount (INTERNAL CREDITS)
      await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .update({ 
          balance: freelancerWallet.balance + proratedAmount 
        });

      // Create payment event record (INTERNAL CREDIT RELEASE)
      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: milestone.project_id,
        milestone_id: milestoneId,
        type: 'prorated_release',
        amount: proratedAmount,
        // NO razorpay_transfer_id needed for internal credits
        triggered_by: triggeredBy
      });

      // 4. Update PFI score for partial milestone completion
      await this.updatePfiScore(project.freelancer_id, 'milestone_passed'); // Partial still gets some points

      await trx.commit();

      logger.info('Prorated milestone payment released with internal credits', {
        milestone_id: milestoneId,
        prorated_amount: proratedAmount,
        original_amount: milestone.payment_amount,
        pass_rate: passRate,
        freelancer_id: project.freelancer_id,
        new_wallet_balance: freelancerWallet.balance + proratedAmount
      });

      return paymentEvent;

    } catch (error) {
      await trx.rollback();
      logger.error('Error releasing prorated milestone payment', error);
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

      // Update freelancer_wallet balance with INTERNAL CREDITS
      await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .increment('balance', milestone.amount);

      // Create payment_event milestone_release (INTERNAL CREDITS)
      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: milestone.project_id,
        milestone_id: milestoneId,
        type: 'milestone_release',
        amount: milestone.amount,
        // NO razorpay_transfer_id needed for internal credits
        triggered_by: triggeredBy
      });

      // 4. Update PFI score for milestone completion
      await this.updatePfiScore(project.freelancer_id, 'milestone_passed');

      await trx.commit();

      logger.info('Milestone payment released with internal credits', {
        milestone_id: milestoneId,
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
  public async updatePfiScore(freelancerId: string, action: 'milestone_passed' | 'milestone_failed' | 'milestone_delayed'): Promise<void> {
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

}
