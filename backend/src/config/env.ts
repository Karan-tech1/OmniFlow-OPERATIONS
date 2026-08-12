import 'dotenv/config';
import { z } from 'zod';
const parsed = z.object({ PORT: z.coerce.number().default(5000), DATABASE_URL: z.string().url(), JWT_SECRET: z.string().min(24), JWT_EXPIRES_IN: z.string().default('8h'), FRONTEND_URL: z.string().url(), NODE_ENV: z.enum(['development','test','production']).default('development') }).safeParse(process.env);
if (!parsed.success) { console.error(parsed.error.flatten().fieldErrors); throw new Error('Invalid environment configuration'); }
export const env = parsed.data;
