import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { logger } from '../../utils/logger';

export class StripeController {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/payments/stripe/create-checkout-session', req.body);
    try {
      const user = (req as any).user;
      const { projectId } = req.body;

      if (!user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      if (!projectId) { res.status(400).json({ error: 'projectId is required' }); return; }
      if (!process.env.STRIPE_SECRET_KEY) {
        res.status(503).json({ error: 'Stripe is not configured on this server' });
        return;
      }

      const url = await this.stripeService.createCheckoutSession(projectId, user.userId);
      res.status(200).json({ url });
    } catch (error) {
      logger.error('Create Stripe checkout session error', error);
      const message = error instanceof Error ? error.message : 'Failed to create checkout session';
      res.status(500).json({ error: message });
    }
  };

  verifySession = async (req: Request, res: Response): Promise<void> => {
    logger.request('POST', '/payments/stripe/verify-session', req.body);
    try {
      const user = (req as any).user;
      const { sessionId, projectId } = req.body;

      if (!user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      if (!sessionId || !projectId) {
        res.status(400).json({ error: 'sessionId and projectId are required' });
        return;
      }

      const paymentEvent = await this.stripeService.verifyAndFundProject(sessionId, projectId, user.userId);
      res.status(200).json({ success: true, payment_event: paymentEvent });
    } catch (error) {
      logger.error('Verify Stripe session error', error);
      const message = error instanceof Error ? error.message : 'Verification failed';
      res.status(400).json({ error: message });
    }
  };
}
