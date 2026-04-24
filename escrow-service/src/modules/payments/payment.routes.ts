import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

router.use(authenticateToken);

// POST /payments/projects/:projectId/fund — simulate client funding escrow (no payment gateway)
router.post('/projects/:projectId/fund', paymentController.fundProject);

// POST /payments/milestones/:milestoneId/release — release full payment to freelancer
router.post('/milestones/:milestoneId/release', paymentController.releaseMilestonePayment);

// POST /payments/milestones/:milestoneId/release-prorated — release partial payment
router.post('/milestones/:milestoneId/release-prorated', paymentController.releaseProratedPayment);

// GET /payments/projects/:projectId/payment-events — view payment history
router.get('/projects/:projectId/payment-events', paymentController.getProjectPaymentEvents);

export { router as paymentRouter };
