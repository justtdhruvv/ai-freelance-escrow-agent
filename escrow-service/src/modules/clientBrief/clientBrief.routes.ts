import { Router } from 'express';
import { ClientBriefController } from './clientBrief.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const clientBriefController = new ClientBriefController();

// Apply JWT authentication middleware to all client brief routes
router.use(authenticateToken);

// POST /projects/:projectId/brief - Submit a project brief (project owner only)
router.post('/:projectId/brief', clientBriefController.createClientBrief);

// GET /projects/:projectId/brief - Get project brief (project owner only)
router.get('/:projectId/brief', clientBriefController.getClientBrief);

export const clientBriefRouter = router;
