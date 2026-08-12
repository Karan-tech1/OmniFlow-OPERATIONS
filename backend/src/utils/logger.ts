import { pino } from 'pino';
import { pinoHttp } from 'pino-http';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`
});

export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req, res) => `${req.method} ${req.url} - ${res.statusCode}`
});
