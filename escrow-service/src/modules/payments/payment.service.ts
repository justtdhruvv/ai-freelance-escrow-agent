import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface PaymentEvent {
  payment_event_id: string;
  project_id: string;
  milestone_id?: string;
  type: 'escrow_hold' | 'milestone_release' | 'prorated_release' | 'refund';
  amount: number;
  triggered_by: 'aqa_auto' | 'manual' | 'dispute_resolution';
  created_at?: Date | string;
}

export interface CreatePaymentEventInput {
  project_id: string;
  milestone_id?: string;
  type: 'escrow_hold' | 'milestone_release' | 'prorated_release' | 'refund';
  amount: number;
  triggered_by?: 'aqa_auto' | 'manual' | 'dispute_resolution';
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
   * Fund project into escrow — updates project status and records the escrow hold
   */
  async fundProject(projectId: string): Promise<PaymentEvent> {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');
    if (!project.total_price || project.total_price <= 0) throw new Error('Project must have a valid total price');
    if (project.status !== 'draft' && project.status !== 'sop_review' && project.status !== 'client_review' && project.status !== 'pending') {
      throw new Error('Project is already funded or not in a fundable state');
    }

    const trx = await db.transaction();
    try {
      await trx('projects')
        .where({ project_id: projectId })
        .update({
          escrow_balance: project.total_price,
          status: 'active',
        });

      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: projectId,
        type: 'escrow_hold',
        amount: project.total_price,
        triggered_by: 'manual',
      });

      await trx.commit();

      logger.info('Project funded into escrow', {
        project_id: projectId,
        amount: project.total_price,
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
      const milestone = await trx('milestone_checks').where({ milestone_id: milestoneId }).first();
      if (!milestone) throw new Error('Milestone not found');

      if (passRate < 0 || passRate > 1) throw new Error('Pass rate must be between 0 and 1');

      const project = await trx('projects').where({ project_id: milestone.project_id }).first();
      if (!project) throw new Error('Project not found');

      const proratedAmount = Math.floor(milestone.payment_amount * passRate);
      if (proratedAmount <= 0) throw new Error('Prorated amount must be greater than 0');

      let freelancerWallet = await trx('freelancer_wallets').where({ freelancer_id: project.freelancer_id }).first();

      if (!freelancerWallet) {
        const walletId = uuidv4();
        await trx('freelancer_wallets').insert({
          wallet_id: walletId,
          freelancer_id: project.freelancer_id,
          balance: 0,
          created_at: new Date(),
        });
        freelancerWallet = { wallet_id: walletId, freelancer_id: project.freelancer_id, balance: 0 };
      }

      await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .update({ balance: freelancerWallet.balance + proratedAmount });

      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: milestone.project_id,
        milestone_id: milestoneId,
        type: 'prorated_release',
        amount: proratedAmount,
        triggered_by: triggeredBy,
      });

      await this.updatePfiScore(project.freelancer_id, 'milestone_passed');
      await trx.commit();

      logger.info('Prorated milestone payment released', {
        milestone_id: milestoneId,
        prorated_amount: proratedAmount,
        pass_rate: passRate,
        freelancer_id: project.freelancer_id,
      });

      return paymentEvent;
    } catch (error) {
      await trx.rollback();
      logger.error('Error releasing prorated milestone payment', error);
      throw error;
    }
  }

  /**
   * Release full milestone payment to freelancer
   */
  async releaseMilestonePayment(milestoneId: string, triggeredBy: 'aqa_auto' | 'manual' | 'dispute_resolution'): Promise<PaymentEvent> {
    const trx = await db.transaction();

    try {
      const milestone = await trx('milestone_checks').where({ milestone_id: milestoneId }).first();
      if (!milestone) throw new Error('Milestone not found');
      if (milestone.status !== 'passed') throw new Error('Milestone must be passed before payment can be released');

      const milestoneAmount = milestone.payment_amount ?? milestone.amount;

      const project = await trx('projects').where({ project_id: milestone.project_id }).first();
      if (!project) throw new Error('Project not found');
      if (project.escrow_balance < milestoneAmount) throw new Error('Insufficient escrow balance');

      let freelancerWallet = await trx('freelancer_wallets').where({ freelancer_id: project.freelancer_id }).first();

      if (!freelancerWallet) {
        const walletId = uuidv4();
        await trx('freelancer_wallets').insert({
          wallet_id: walletId,
          freelancer_id: project.freelancer_id,
          balance: 0,
          created_at: new Date(),
        });
        freelancerWallet = await trx('freelancer_wallets').where({ wallet_id: walletId }).first();
      }

      await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .increment('balance', milestoneAmount);

      const paymentEvent = await this.createPaymentEventInTransaction(trx, {
        project_id: milestone.project_id,
        milestone_id: milestoneId,
        type: 'milestone_release',
        amount: milestoneAmount,
        triggered_by: triggeredBy,
      });

      await this.updatePfiScore(project.freelancer_id, 'milestone_passed');
      await trx.commit();

      logger.info('Milestone payment released', {
        milestone_id: milestoneId,
        amount: milestoneAmount,
        freelancer_id: project.freelancer_id,
      });

      return paymentEvent;
    } catch (error) {
      await trx.rollback();
      logger.error('Error releasing milestone payment', error);
      throw error;
    }
  }

  /**
   * Update PFI score based on milestone outcome
   */
  public async updatePfiScore(freelancerId: string, action: 'milestone_passed' | 'milestone_failed' | 'milestone_delayed'): Promise<void> {
    try {
      const scoreChange = action === 'milestone_passed' ? 10 : action === 'milestone_failed' ? -15 : -5;
      await db('users').where({ user_id: freelancerId }).increment('pfi_score', scoreChange);
      logger.info('PFI score updated', { freelancer_id: freelancerId, action, score_change: scoreChange });
    } catch (error) {
      logger.error('Error updating PFI score', error);
      // Non-critical — don't throw
    }
  }

  private async createPaymentEventInTransaction(trx: any, input: CreatePaymentEventInput): Promise<PaymentEvent> {
    const paymentEventId = uuidv4();

    await trx('payment_events').insert({
      payment_event_id: paymentEventId,
      project_id: input.project_id,
      milestone_id: input.milestone_id || null,
      type: input.type,
      amount: input.amount,
      triggered_by: input.triggered_by || 'manual',
      created_at: new Date(),
    });

    const paymentEvent = await trx('payment_events').where({ payment_event_id: paymentEventId }).first();
    if (!paymentEvent) throw new Error('Failed to create payment event');
    return paymentEvent;
  }

  async createPaymentEvent(input: CreatePaymentEventInput): Promise<PaymentEvent> {
    return this.createPaymentEventInTransaction(db, input);
  }

  async getProjectById(projectId: string): Promise<any> {
    try {
      return await db('projects').where({ project_id: projectId }).first() || null;
    } catch (error) {
      logger.error('Error fetching project by ID', error);
      throw new Error('Error fetching project');
    }
  }

  async getMilestoneById(milestoneId: string): Promise<Milestone | null> {
    try {
      return await db('milestone_checks').where({ milestone_id: milestoneId }).first() || null;
    } catch (error) {
      logger.error('Error fetching milestone by ID', error);
      throw new Error('Error fetching milestone');
    }
  }

  async getFreelancerWallet(freelancerId: string): Promise<FreelancerWallet | null> {
    try {
      return await db('freelancer_wallets').where({ freelancer_id: freelancerId }).first() || null;
    } catch (error) {
      logger.error('Error fetching freelancer wallet', error);
      throw new Error('Error fetching freelancer wallet');
    }
  }

  async getPaymentEventsByProject(projectId: string): Promise<PaymentEvent[]> {
    try {
      return await db('payment_events').where({ project_id: projectId }).orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Error fetching payment events by project', error);
      throw new Error('Error fetching payment events');
    }
  }
}
