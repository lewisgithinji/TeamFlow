import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import winston from 'winston';

// Augment the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      id: string;
      logger: winston.Logger;
    }
  }
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  // In development, use a colorized, simple format.
  // In production, use JSON format.
  process.env.NODE_ENV === 'development'
    ? winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    : winston.format.json()
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  defaultMeta: {
    service: 'teamflow-api',
  },
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate a unique request ID, or use the one from the 'x-request-id' header if present
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Create a child logger with the requestId, which will be included in all logs
  const requestScopedLogger = logger.child({ requestId });

  // Attach the ID and logger to the request object for use in other middleware/handlers
  req.id = requestId;
  req.logger = requestScopedLogger;

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Use the request-scoped logger to automatically include the requestId
    req.logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - ${req.ip}`);
  });
  next();
};
