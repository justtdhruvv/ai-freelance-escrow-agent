import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const walletController = new WalletController();

// Apply authentication middleware to all wallet routes
router.use(authenticateToken);

// GET /wallet - Get freelancer wallet details
router.get('/', walletController.getWallet);

// GET /wallet/transactions - Get wallet transaction history
router.get('/transactions', walletController.getTransactionHistory);

// POST /wallet/convert - Convert internal credits to real money
router.post('/convert', walletController.convertToRealMoney);

// GET /wallet/conversions/:conversion_id - Get conversion status
router.get('/conversions/:conversion_id', walletController.getConversionStatus);

// POST /wallet/add-credits - Add manual credits (admin/demo function)
router.post('/add-credits', walletController.addCredits);

export default router;
