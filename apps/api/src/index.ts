/**
 * TeamFlow API Server
 *
 * This is the main entry point for the TeamFlow Express API. It sets up the server,
 * configures middleware, defines routes, initializes WebSockets, and starts listening for requests.
 */
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import workspaceRoutes from './modules/workspace/workspace.routes';
import projectRoutes from './modules/project/project.routes';
import taskRoutes from './modules/task/task.routes';
import notificationRoutes from './modules/notification/notification.routes';
import attachmentRoutes from './modules/attachment/attachment.routes';
import activityRoutes from './modules/activity/activity.routes';
import automationRoutes from './modules/automation/automation.routes';
import invitationRoutes from './modules/invitation/invitation.routes';
import searchRoutes from './modules/search/search.routes';
import labelRoutes from './modules/label/label.routes';
import slackRoutes from './modules/slack/slack.routes';
import { AppError } from './utils/errors';
import { logger, requestLogger } from './utils/logger';
import { initializeSocketServer, setSocketServer } from './websocket';

// --- Express App Initialization ---
export const app = express();
const PORT = process.env.PORT || 4000;

/**
 * We create an explicit HTTP server here to share it with the WebSocket server (Socket.IO).
 * This allows both Express and Socket.IO to listen on the same port.
 */
const httpServer = createServer(app);

// --- Core Middleware Setup ---

// Sets various security-related HTTP headers to protect the application.
app.use(helmet());

/**
 * A whitelist of allowed origins for Cross-Origin Resource Sharing (CORS).
 * This is crucial for security, ensuring that only our trusted frontend applications
 * can make requests to this API.
 */
const allowedOrigins = [
  'http://localhost:3000', // Default Next.js port
  'http://localhost:3001', // Common alternative Next.js port
];

/**
 * CORS configuration options. We use a function for the `origin` to dynamically
 * check if the request's origin is in our `allowedOrigins` whitelist.
 */
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Parses incoming JSON payloads.
app.use(express.json());
// Parses incoming URL-encoded payloads.
app.use(express.urlencoded({ extended: true }));
// Use our custom structured request logger.
app.use(requestLogger);

// --- Public & Health Routes ---

/**
 * Root endpoint to provide basic API information and confirm the server is running.
 */
app.get('/', (req, res) => {
  res.json({
    name: 'TeamFlow API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      workspaces: '/api/workspaces',
      health: '/health',
      docs: '/api/docs',
    },
  });
});

/**
 * Health check endpoint used by monitoring services and deployment platforms
 * to verify that the application is alive and operational.
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --- API Route Definitions ---

// Modular routing setup. Each feature module has its own routes file.
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', attachmentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api', automationRoutes);
app.use('/api', labelRoutes);
app.use('/api/slack', slackRoutes);

/**
 * Provides a summary of available v1 API endpoints.
 */
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'TeamFlow API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      workspaces: {
        create: 'POST /api/workspaces',
        list: 'GET /api/workspaces',
        get: 'GET /api/workspaces/:id',
        update: 'PATCH /api/workspaces/:id',
        delete: 'DELETE /api/workspaces/:id',
      },
      health: 'GET /health',
      docs: 'GET /api/docs',
    },
  });
});

// --- Error Handling Middleware ---

/**
 * Catch-all handler for routes that are not found.
 * This must be placed after all other route definitions.
 */
app.use((req, res) => {
  req.logger.warn('Route not found', { method: req.method, path: req.path });
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/**
 * Global error handler. All errors passed to `next(err)` will be processed here.
 * This ensures a consistent error response format.
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Handle operational errors (instances of AppError)
  if (err instanceof AppError) {
    req.logger.warn('Operational Error', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Handle unexpected, non-operational errors
  req.logger.error('Unhandled Error', { error: err, stack: err.stack });

  // In production, send a generic message. In development, send the full error.
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server.'
      : err.message;

  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message },
  });
});

// --- Server Startup Logic ---

// Module-scoped variable to hold the initialized Socket.IO server instance.
let io: Awaited<ReturnType<typeof initializeSocketServer>> | null = null;

/**
 * Asynchronous function to initialize services (like WebSockets) and start the HTTP server.
 * This keeps the startup process clean and allows for `await`ing initializations.
 */
async function startServer() {
  try {
    // Initialize WebSocket server with Redis adapter
    const socketServer = await initializeSocketServer(httpServer);
    io = socketServer; // Assign to the module-scoped variable
    setSocketServer(io);

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 API server running on http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API v1: http://localhost:${PORT}/api/v1`);
      logger.info(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', { error });
    process.exit(1);
  }
}

/**
 * This check ensures that the server only starts when the script is executed directly
 * (e.g., `node dist/index.js`). It prevents the server from starting automatically
 * when this file is imported by another module, which is crucial for testing
 * or for use in other scripts.
 */
if (require.main === module) {
  startServer();
}

export default app;
export { io };
