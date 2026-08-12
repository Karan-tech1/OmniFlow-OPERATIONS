import type { Role } from './enums.js';
declare global { namespace Express { interface Request { user?: { id: string; role: Role; email: string } } } }
export {};
