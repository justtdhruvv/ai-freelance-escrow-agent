import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { MockRazorpayService } from './mockRazorpay.service';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

export interface WebhookEvent {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id?: string;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status?: string;
        captured: boolean;
        description?: string;
        card_id?: string;
        bank?: any;
        wallet?: string;
        vpa?: string;
        email?: string;
        contact?: string;
        notes?: Record<string, string>;
        fee?: number;
        tax?: number;
        error_code?: string;
        error_description?: string;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        attempts: number;
        notes?: Record<string, string>;
        created_at: number;
      };
    };
    transfer?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        recipient_id: string;
        notes?: Record<string, string>;
        created_at: number;
      };
    };
    refund?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        payment_id: string;
        status: string;
        created_at: number;
      };
    };
  };
}

export class WebhookService {
  private mockRazorpayService: MockRazorpayService;

  constructor() {
    this.mockRazorpayService = new MockRazorpayService();
  }

  /**
   * Verify webhook signature (mock implementation - always returns true for development)
   */
  verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string,
    webhookSecret: string
  ): boolean {
    // In mock system, always return true
    // In production, use real Razorpay signature verification
    logger.info('Mock webhook signature verification', {
      body_length: webhookBody.length,
      signature: webhookSignature,
      mock_mode: true
    });

    return true;
  }

  /**
   * Handle incoming webhook events
   */
  async handleWebhookEvent(event: string, eventData: any): Promise<void> {
    logger.info('Processing webhook event', { event, data: eventData });

    try {
      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(eventData);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(eventData);
          break;
        case 'transfer.processed':
          await this.handleTransferProcessed(eventData);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(eventData);
          break;
        default:
          logger.info('Unhandled webhook event', { event });
      }
    } catch (error) {
      logger.error('Error processing webhook event', { event, error });
      throw error;
    }
  }

  /**
   * Handle payment captured webhook
   */
  private async handlePaymentCaptured(eventData: WebhookEvent): Promise<void> {
    const payment = eventData.payload.payment?.entity;
    const order = eventData.payload.order?.entity;

    // Extract project_id from order notes
    const projectId = order?.notes?.project_id;
    if (!projectId) {
      logger.error('Project ID not found in payment captured webhook');
      return;
    }

    const trx = await db.transaction();

    try {
      // Convert amount from paise to rupees for database storage
      const amountInRupees = MockRazorpayService.convertToRupees(payment.amount);

      // Increase project escrow_balance
      await trx('projects')
        .where({ project_id: projectId })
        .increment('escrow_balance', amountInRupees);

      // Create escrow hold payment event
      await trx('payment_events')
        .insert({
          payment_event_id: uuidv4(),
          project_id: projectId,
          type: 'escrow_hold',
          amount: amountInRupees,
          razorpay_order_id: order.id,
          razorpay_payment_id: payment.id,
          triggered_by: 'manual',
          created_at: new Date()
        });

      // Update project status to active
      await trx('projects')
        .where({ project_id: projectId })
        .update({ status: 'active' });

      await trx.commit();

      logger.info('Payment captured and escrow hold created via webhook', {
        project_id: projectId,
        payment_id: payment.id,
        order_id: order.id,
        amount: amountInRupees
      });
    } catch (error) {
      await trx.rollback();
      logger.error('Error handling payment captured webhook', error);
      throw error;
    }
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(eventData: WebhookEvent): Promise<void> {
    const payment = eventData.payload.payment?.entity;
    const order = eventData.payload.order?.entity;

    // Extract project_id from order notes
    const projectId = order?.notes?.project_id;
    if (!projectId) {
      logger.error('Project ID not found in payment failed webhook');
      return;
    }

    // Create payment failed event for tracking
    await db('payment_events')
      .insert({
        payment_event_id: uuidv4(),
        project_id: projectId,
        type: 'refund', // Using refund type for failed payments
        amount: MockRazorpayService.convertToRupees(payment.amount),
        razorpay_order_id: order.id,
        razorpay_payment_id: payment.id,
        triggered_by: 'manual',
        created_at: new Date()
      });

    logger.info('Payment failed recorded via webhook', {
      project_id: projectId,
      payment_id: payment.id,
      order_id: order.id,
      error: payment.error_description
    });
  }

  /**
   * Handle transfer processed webhook
   */
  private async handleTransferProcessed(eventData: WebhookEvent): Promise<void> {
    const transfer = eventData.payload.transfer?.entity;

    // Extract project_id and milestone_id from transfer notes
    const projectId = transfer.notes?.project_id;
    const milestoneId = transfer.notes?.milestone_id;

    if (!projectId || !milestoneId) {
      logger.error('Project ID or Milestone ID not found in transfer webhook');
      return;
    }

    const trx = await db.transaction();

    try {
      // Get milestone details
      const milestone = await trx('milestone_checks')
        .where({ milestone_id: milestoneId })
        .first();

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // Get project details
      const project = await trx('projects')
        .where({ project_id: projectId })
        .first();

      if (!project) {
        throw new Error('Project not found');
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

      // Convert amount from paise to rupees
      const amountInRupees = MockRazorpayService.convertToRupees(transfer.amount);

      // Update freelancer wallet balance
      await trx('freelancer_wallets')
        .where({ freelancer_id: project.freelancer_id })
        .increment('balance', amountInRupees);

      // Create milestone release payment event
      await trx('payment_events')
        .insert({
          payment_event_id: uuidv4(),
          project_id: projectId,
          milestone_id: milestoneId,
          type: 'milestone_release',
          amount: amountInRupees,
          razorpay_transfer_id: transfer.id,
          triggered_by: 'manual',
          created_at: new Date()
        });

      await trx.commit();

      logger.info('Transfer processed and milestone released via webhook', {
        project_id: projectId,
        milestone_id: milestoneId,
        transfer_id: transfer.id,
        amount: amountInRupees,
        freelancer_id: project.freelancer_id
      });
    } catch (error) {
      await trx.rollback();
      logger.error('Error handling transfer processed webhook', error);
      throw error;
    }
  }

  /**
   * Handle refund processed webhook
   */
  private async handleRefundProcessed(eventData: WebhookEvent): Promise<void> {
    const refund = eventData.payload.refund?.entity;

    // Find original payment event to get project details
    const originalPaymentEvent = await db('payment_events')
      .where({ razorpay_payment_id: refund.payment_id })
      .first();

    if (!originalPaymentEvent) {
      logger.error('Original payment event not found for refund');
      return;
    }

    const trx = await db.transaction();

    try {
      // Convert amount from paise to rupees
      const amountInRupees = MockRazorpayService.convertToRupees(refund.amount);

      // Deduct from project escrow_balance
      await trx('projects')
        .where({ project_id: originalPaymentEvent.project_id })
        .decrement('escrow_balance', amountInRupees);

      // Create refund payment event
      await trx('payment_events')
        .insert({
          payment_event_id: uuidv4(),
          project_id: originalPaymentEvent.project_id,
          type: 'refund',
          amount: amountInRupees,
          razorpay_payment_id: refund.payment_id,
          triggered_by: 'dispute_resolution',
          created_at: new Date()
        });

      await trx.commit();

      logger.info('Refund processed via webhook', {
        project_id: originalPaymentEvent.project_id,
        refund_id: refund.id,
        payment_id: refund.payment_id,
        amount: amountInRupees
      });
    } catch (error) {
      await trx.rollback();
      logger.error('Error handling refund processed webhook', error);
      throw error;
    }
  }

  /**
   * Create test webhook event for development
   */
  async createTestWebhookEvent(eventType: string, projectId: string, milestoneId?: string): Promise<any> {
    switch (eventType) {
      case 'payment.captured':
        return {
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: this.mockRazorpayService.generateMockPaymentId(),
                entity: 'payment',
                amount: MockRazorpayService.convertToPaise(5000),
                currency: 'INR',
                status: 'captured',
                order_id: `order_MOCK_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                international: false,
                method: 'card',
                amount_refunded: 0,
                captured: true,
                created_at: Date.now()
              }
            }
          }
        };

      case 'transfer.processed':
        return {
          event: 'transfer.processed',
          payload: {
            transfer: {
              entity: {
                id: this.mockRazorpayService.generateMockTransferId(),
                entity: 'transfer',
                amount: MockRazorpayService.convertToPaise(1000),
                currency: 'INR',
                status: 'processed',
                recipient_id: 'acc_MOCK_RECIPIENT',
                notes: {
                  project_id: projectId,
                  milestone_id: milestoneId,
                  type: 'milestone_release'
                },
                created_at: Date.now()
              }
            }
          }
        };

      default:
        throw new Error(`Unsupported test webhook event type: ${eventType}`);
    }
  }
}
