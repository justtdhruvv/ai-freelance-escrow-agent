import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
const walletController = new WalletController();

// Apply authentication middleware to all wallet routes
router.use(authenticateToken);
router.use(requireRole('freelancer'));

// GET /wallet - Get freelancer wallet details
router.get('/', walletController.getWallet);

// GET /wallet/transactions - Get wallet transaction history
router.get('/transactions', walletController.getTransactionHistory);

// POST /wallet/convert - Convert internal credits to real money
router.post('/convert', walletController.convertToRealMoney);

// GET /wallet/conversions/:conversion_id - Get conversion status
router.get('/conversions/:conversion_id', walletController.getConversionStatus);

// REMOVED: /wallet/add-credits endpoint for security
// Credits should only be added automatically via AQA milestone completions

export default router;
