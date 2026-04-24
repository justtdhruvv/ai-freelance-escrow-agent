import { Router } from 'express';
import { DisputeController } from './dispute.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const disputeController = new DisputeController();

router.use(authenticateToken);

// POST /disputes — open a dispute
router.post('/', disputeController.createDispute);

// GET /disputes — list all disputes (admin/freelancer overview)
router.get('/', disputeController.getAllDisputes);

// GET /disputes/mine — disputes raised by current user
router.get('/mine', disputeController.getMyDisputes);

// GET /disputes/project/:project_id — disputes for a project
router.get('/project/:project_id', disputeController.getProjectDisputes);

// PUT /disputes/:dispute_id/resolve — resolve a dispute
router.put('/:dispute_id/resolve', disputeController.resolveDispute);

// PUT /disputes/:dispute_id/status — update dispute status
router.put('/:dispute_id/status', disputeController.updateDisputeStatus);

export default router;
