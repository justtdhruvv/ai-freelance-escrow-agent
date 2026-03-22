import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';
import { logger } from '../../utils/logger';

export class WebhookController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  /**
   * Handle Razorpay webhook events
   * POST /payments/webhook
   */
  handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/payments/webhook', req.body);
    
    try {
      const webhookBody = JSON.stringify(req.body);
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      // Verify webhook signature
      if (!this.webhookService.verifyWebhookSignature(
        webhookBody,
        webhookSignature,
        webhookSecret || 'mock_webhook_secret'
      )) {
        logger.error('Invalid webhook signature', {
          signature: webhookSignature,
          body_length: webhookBody.length
        });

        const errorResponse = { error: 'Invalid webhook signature' };
        res.status(401).json(errorResponse);
        return;
      }

      // Extract event type from request body
      const event = req.body.event;
      const eventData = req.body;

      if (!event) {
        const errorResponse = { error: 'Event type is required' };
        res.status(400).json(errorResponse);
        return;
      }

      // Process the webhook event
      await this.webhookService.handleWebhookEvent(event, eventData);

      const successResponse = { 
        message: 'Webhook processed successfully',
        event: event
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Webhook processing error', error);
      
      const errorResponse = { 
        error: 'Webhook processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Verify webhook configuration
   * GET /payments/webhook/verify
   */
  verifyWebhookConfig = async (req: Request, res: Response): Promise<void> => {
    logger.request('GET', '/payments/webhook/verify');
    
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        const errorResponse = { error: 'Webhook secret not configured' };
        res.status(500).json(errorResponse);
        return;
      }

      const successResponse = {
        webhook_configured: true,
        endpoint: '/payments/webhook',
        supported_events: [
          'payment.captured',
          'payment.failed',
          'transfer.processed',
          'refund.processed'
        ],
        mock_mode: webhookSecret === 'mock_webhook_secret'
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Webhook verification error', error);
      
      const errorResponse = { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      
      res.status(500).json(errorResponse);
    }
  };

  /**
   * Test webhook (development only)
   * POST /payments/webhook/test
   */
  testWebhook = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/payments/webhook/test', req.body);
    
    try {
      const { event_type, project_id, milestone_id } = req.body;
      
      if (!event_type || !project_id) {
        const errorResponse = { 
          error: 'event_type and project_id are required' 
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Create test webhook event
      const testWebhookEvent = await this.webhookService.createTestWebhookEvent(
        event_type,
        project_id,
        milestone_id
      );

      logger.info('Test webhook event created', {
        event_type,
        project_id,
        milestone_id
      });

      // Process the test webhook event
      await this.webhookService.handleWebhookEvent(
        testWebhookEvent.event,
        testWebhookEvent
      );

      const successResponse = {
        message: 'Test webhook processed successfully',
        event_type: event_type,
        project_id: project_id,
        milestone_id: milestone_id,
        test_event: testWebhookEvent
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Test webhook error', error);
      
      const errorResponse = { 
        error: 'Test webhook failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
      
      res.status(500).json(errorResponse);
    }
  };
}
