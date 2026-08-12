import * as Sentry from '@sentry/node';
import type { Express } from 'express';

export function initSentry(app: Express) {
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    });
    console.log('[Sentry] Backend error tracking initialized');
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}
