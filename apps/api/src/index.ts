import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './modules/auth/auth.routes';
import workspaceRoutes from './modules/workspace/workspace.routes';
import projectRoutes from './modules/project/project.routes';
import taskRoutes from './modules/task/task.routes';
import notificationRoutes from './modules/notification/notification.routes';
import activityRoutes from './modules/activity/activity.routes';
import { initializeSocketServer, setSocketServer } from './websocket';

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root route
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);

// API info endpoint
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Initialize WebSocket server and start server
let io: Awaited<ReturnType<typeof initializeSocketServer>>;

(async () => {
  try {
    // Initialize WebSocket server with Redis adapter
    io = await initializeSocketServer(httpServer);
    setSocketServer(io);

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API v1: http://localhost:${PORT}/api/v1`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();

export default app;
export { io };
