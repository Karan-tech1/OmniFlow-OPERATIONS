import type { Response } from 'express';
export const ok = <T>(res: Response, data: T, message = 'Success', status = 200) => res.status(status).json({ success: true, message, data });
export class AppError extends Error { constructor(public status: number, message: string, public code = 'REQUEST_ERROR') { super(message); } }
