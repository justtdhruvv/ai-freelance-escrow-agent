import { Router } from 'express';
import { SOPController } from './sop.controller';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';


const router = Router();
const sopController = new SOPController();

// Generate and store SOP from AI
router.post('/generate', authenticateToken, requireRole('freelancer'), sopController.generateSOP);

// Get SOP by ID
router.get('/:sop_id', sopController.getSOPById);

// Get all SOPs for a project
router.get('/project/:project_id', sopController.getSOPsByProjectId);

// Get milestones for a SOP
router.get('/:sop_id/milestones', sopController.getMilestonesBySOPId);

// Get verification checks for a milestone
router.get('/milestones/:milestone_id/checks', sopController.getVerificationChecksByMilestoneId);

// Get verification check by ID
router.get('/checks/:check_id', sopController.getVerificationCheckById);

// POST /sops/:sop_id/approve — approve SOP as the authenticated user's role
router.post('/:sop_id/approve', authenticateToken, sopController.approveSOP);

export default router;
