import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Payment routes (JWT authentication required)
router.use(authenticateToken);

// POST /projects/:projectId/escrow - Create escrow order for project funding
router.post('/projects/:projectId/escrow', paymentController.createEscrowOrder);

// POST /payments/confirm - Confirm real payment
router.post('/confirm', paymentController.confirmPayment);

// POST /milestones/:milestoneId/release - Release milestone payment to freelancer
router.post('/milestones/:milestoneId/release', paymentController.releaseMilestonePayment);

// GET /projects/:projectId/payment-events - Get payment events for a project
router.get('/projects/:projectId/payment-events', paymentController.getProjectPaymentEvents);

// GET /payments/key - Get Razorpay public key
router.get('/key', paymentController.getRazorpayKey);

// Webhook routes (no JWT authentication required - Razorpay needs direct access)
// Create a separate router for webhooks without authentication middleware
const webhookRouter = Router();
const webhookController = new WebhookController();

// POST /payments/webhook - Handle Razorpay webhooks
webhookRouter.post('/webhook', webhookController.handleRazorpayWebhook);

// GET /payments/webhook/verify - Verify webhook configuration
webhookRouter.get('/webhook/verify', webhookController.verifyWebhookConfig);

// POST /payments/webhook/test - Test webhook (development only)
webhookRouter.post('/webhook/test', webhookController.testWebhook);

export { router as paymentRouter, webhookRouter };
