import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../types/enums.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/api.js';

type Payload = { sub: string; role: Role; email: string };
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token) throw new AppError(401, 'Authentication is required', 'UNAUTHORIZED'); const payload = jwt.verify(token, env.JWT_SECRET) as Payload; req.user = { id: payload.sub, role: payload.role, email: payload.email }; next(); } catch (error) { next(error instanceof AppError ? error : new AppError(401, 'Your session has expired. Please sign in again.', 'INVALID_TOKEN')); }
};
export const authorize = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => !req.user || !roles.includes(req.user.role) ? next(new AppError(403, 'You do not have permission for this action', 'FORBIDDEN')) : next();
