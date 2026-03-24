import { Router } from 'express';
import { SubmissionController } from './submission.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const submissionController = new SubmissionController();

// Apply JWT authentication middleware to all submission routes
router.use(authenticateToken);

// POST /projects/:project_id/milestones/:milestone_id/submissions - Create submission
router.post('/projects/:project_id/milestones/:milestone_id/submissions', submissionController.createSubmission);

// GET /submissions/:submission_id - Get submission by ID
router.get('/submissions/:submission_id', submissionController.getSubmission);

// Alternative route for submission creation (simpler)
// POST /milestones/:milestone_id/submissions - Create submission
router.post('/milestones/:milestone_id/submissions', (req, res, next) => {
  // Extract project_id from body for this route
  req.body.project_id = req.body.project_id || req.headers['x-project-id'];
  submissionController.createSubmission(req, res);
});

export default router;
