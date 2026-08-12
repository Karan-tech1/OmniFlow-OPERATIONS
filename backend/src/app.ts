import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import router from './routes.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { httpLogger } from './utils/logger.js';
import { initSentry } from './utils/sentry.js';
import { initFollowUpCronJobs } from './services/cron.service.js';

export const app = express();

initSentry(app);
initFollowUpCronJobs();

const allowedOrigins = [
  env.FRONTEND_URL,
  env.FRONTEND_URL?.replace(/\/$/, ''),
  'https://omni-flow-operations-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, '')) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(httpLogger);

// Static uploads serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }), router);
app.use(notFound, errorHandler);
