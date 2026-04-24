import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

// Apply JWT authentication middleware to all user routes
router.use(authenticateToken);

// POST /users/create-client - Create client account (freelancer only)
router.post('/create-client', userController.createClientAccount);

// GET /users/profile - Get current user profile
router.get('/profile', userController.getUserProfile);

// PUT /users/profile - Update user profile (github_token, stripe_account_id, etc.)
router.put('/profile', userController.updateUserProfile);

// POST /users/test-email - Test email service connection
router.post('/test-email', userController.testEmailConnection);

export const userRouter = router;
