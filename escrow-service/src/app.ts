import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health';
import { authRouter } from './modules/auth/auth.routes';
import { projectRouter } from './modules/projects/project.routes';
import { clientBriefRouter } from './modules/clientBrief/clientBrief.routes';
import { verificationContractRouter } from './modules/verificationContract/verificationContract.routes';
import { userRouter } from './modules/users/user.routes';
import { clientRouter } from './modules/clients/client.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { aiRouter } from './modules/ai/ai.routes';
import sopRouter from './modules/sops/sop.routes';
import submissionRouter from './modules/submissions/submission.routes';
import aqaRouter from './modules/aqa/aqa.routes';
import walletRouter from './modules/wallets/wallet.routes';
import disputeRouter from './modules/disputes/dispute.routes';

const app = express();

// Security: helmet sets secure HTTP headers
app.use(helmet());

// Backend is proxied through Next.js — browser never talks to Express directly in production.
// CORS_ORIGIN only matters for local dev testing against Express directly.
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
};

// Rate limiting: 100 requests per 15 minutes globally
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

app.use('/health', healthRouter);
app.use('/auth', authLimiter, authRouter);
app.use('/projects', projectRouter);
app.use('/projects', clientBriefRouter);
app.use('/projects', verificationContractRouter);
app.use('/users', userRouter);
app.use('/clients', clientRouter);
app.use('/payments', paymentRouter);
app.use('/wallet', walletRouter);
app.use('/ai', aiRouter);
app.use('/sops', sopRouter);
app.use('/disputes', disputeRouter);
app.use('/', submissionRouter);
app.use('/', aqaRouter);

export default app;
