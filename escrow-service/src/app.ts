import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './modules/auth/auth.routes';
import { projectRouter } from './modules/projects/project.routes';
import { clientBriefRouter } from './modules/clientBrief/clientBrief.routes';
import { verificationContractRouter } from './modules/verificationContract/verificationContract.routes';
import { userRouter } from './modules/users/user.routes';
import { clientRouter } from './modules/clients/client.routes';
import { paymentRouter, webhookRouter } from './modules/payments/payment.routes';
import { aiRouter } from './modules/ai/ai.routes';

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/projects', projectRouter);
app.use('/projects', clientBriefRouter);
app.use('/projects', verificationContractRouter);
app.use('/users', userRouter);
app.use('/clients', clientRouter);
app.use('/payments', paymentRouter);
app.use('/payments', webhookRouter);
app.use('/ai', aiRouter);

export default app;
