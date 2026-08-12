import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/api.js';
export const notFound: RequestHandler = (_req, _res, next) => next(new AppError(404, 'Resource not found', 'NOT_FOUND'));
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  if (err instanceof ZodError) return res.status(422).json({ success:false, message:'Validation failed', errors:err.flatten().fieldErrors });
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return res.status(409).json({ success:false, message:'A record with this value already exists', code:'DUPLICATE_RECORD' });
  if (err instanceof Prisma.PrismaClientInitializationError) return res.status(503).json({ success:false, message:'PostgreSQL is unavailable. Start PostgreSQL on localhost:5432, then run the Prisma migration and seed commands.', code:'DATABASE_UNAVAILABLE' });
  const error = err instanceof AppError ? err : new AppError(500, 'Something went wrong. Please try again.', 'INTERNAL_ERROR');
  res.status(error.status).json({ success:false, message:error.message, code:error.code });
};
