import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const aiController = new AIController();

// AI routes (JWT authentication required)
router.use(authenticateToken);

// POST /ai/generate-milestones - Generate milestones from client brief
router.post('/generate-milestones', aiController.generateMilestonesFromBrief);

export { router as aiRouter };
