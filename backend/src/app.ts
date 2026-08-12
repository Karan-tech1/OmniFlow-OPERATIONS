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

app.use(cors({ origin: env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(httpLogger);

// Static uploads serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }), router);
app.use(notFound, errorHandler);
