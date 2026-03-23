import { Router } from 'express';
import { VerificationContractController } from './verificationContract.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const verificationContractController = new VerificationContractController();

// Apply JWT authentication middleware to all verification contract routes
router.use(authenticateToken);

// GET /projects/:projectId/verification-contract - Get verification contract (project owner or assigned freelancer)
router.get('/:projectId/verification-contract', verificationContractController.getVerificationContract);

// POST /verification-contract/:contractId/approve-client - Employer approves contract
router.post('/verification-contract/:contractId/approve-client', verificationContractController.approveClient);

// POST /verification-contract/:contractId/approve-freelancer - Freelancer approves contract
router.post('/verification-contract/:contractId/approve-freelancer', verificationContractController.approveFreelancer);

// POST /verification-contract/:contractId/lock - Lock contract (both parties must approve first)
// router.post('/verification-contract/:contractId/lock', verificationContractController.lockContract);

export const verificationContractRouter = router;
