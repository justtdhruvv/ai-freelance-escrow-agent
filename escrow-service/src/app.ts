import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './modules/auth/auth.routes';

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRouter);
app.use('/auth', authRouter);

export default app;
