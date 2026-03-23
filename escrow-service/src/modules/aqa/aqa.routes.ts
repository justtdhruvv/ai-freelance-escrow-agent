import { Router } from 'express';
import { AQAController } from './aqa.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const aqaController = new AQAController();

// Apply JWT authentication middleware to all AQA routes
router.use(authenticateToken);

// POST /submissions/:submission_id/run-aqa - Run AQA on submission
router.post('/submissions/:submission_id/run-aqa', aqaController.runAQA);

// GET /submissions/:submission_id/aqa-result - Get AQA result for submission
router.get('/submissions/:submission_id/aqa-result', aqaController.getAQAResult);

// POST /submissions/:submission_id/retry-aqa - Retry AQA on submission
router.post('/submissions/:submission_id/retry-aqa', aqaController.retryAQA);

export default router;
