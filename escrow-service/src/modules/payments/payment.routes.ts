import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Payment routes (JWT authentication required)
router.use(authenticateToken);

// POST /projects/:projectId/escrow - Create escrow order for project funding
router.post('/projects/:projectId/escrow', paymentController.createEscrowOrder);

// POST /payments/mock-confirm - Simulate payment success
router.post('/mock-confirm', paymentController.mockPaymentConfirm);

// POST /milestones/:milestoneId/release - Release milestone payment to freelancer
router.post('/milestones/:milestoneId/release', paymentController.releaseMilestonePayment);

// GET /projects/:projectId/payment-events - Get payment events for a project
router.get('/projects/:projectId/payment-events', paymentController.getProjectPaymentEvents);

// GET /payments/key - Get Razorpay public key
router.get('/key', paymentController.getRazorpayKey);

export { router as paymentRouter };
