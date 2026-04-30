import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { StripeController } from './stripe.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();
const stripeController = new StripeController();

router.use(authenticateToken);

// POST /payments/projects/:projectId/fund — simulate client funding escrow (no payment gateway)
router.post('/projects/:projectId/fund', paymentController.fundProject);

// POST /payments/milestones/:milestoneId/release — release full payment to freelancer
router.post('/milestones/:milestoneId/release', paymentController.releaseMilestonePayment);

// POST /payments/milestones/:milestoneId/release-prorated — release partial payment
router.post('/milestones/:milestoneId/release-prorated', paymentController.releaseProratedPayment);

// GET /payments/projects/:projectId/payment-events — view payment history
router.get('/projects/:projectId/payment-events', paymentController.getProjectPaymentEvents);

// Stripe Checkout
// POST /payments/stripe/create-checkout-session — create a Stripe Checkout session for escrow funding
router.post('/stripe/create-checkout-session', stripeController.createCheckoutSession);
// POST /payments/stripe/verify-session — verify Stripe payment and credit project escrow
router.post('/stripe/verify-session', stripeController.verifySession);

export { router as paymentRouter };
