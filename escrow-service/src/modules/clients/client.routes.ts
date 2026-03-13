import { Router } from 'express';
import { ClientController } from './client.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const clientController = new ClientController();

// Apply JWT authentication middleware to all client routes
router.use(authenticateToken);

// POST /clients - Create client account (freelancer only)
router.post('/', clientController.createClient);

// GET /clients - Get all clients for the logged-in freelancer
router.get('/', clientController.getFreelancerClients);

// GET /clients/:clientId - Get specific client by ID (freelancer only)
router.get('/:clientId', clientController.getClientById);

export const clientRouter = router;
