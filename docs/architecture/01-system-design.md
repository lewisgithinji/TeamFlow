# TeamFlow System Architecture

**Version**: 1.0
**Last Updated**: 2025-01-22
**Status**: Ready for Implementation

This document describes the complete system architecture for TeamFlow, an AI-powered project management SaaS platform.

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Component Breakdown](#2-component-breakdown)
3. [Data Flow](#3-data-flow)
4. [Scalability Strategy](#4-scalability-strategy)
5. [Security Architecture](#5-security-architecture)
6. [Observability](#6-observability)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Architecture Decision Records](#8-architecture-decision-records)

---

## 1. High-Level Architecture

### 1.1 System Overview Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "CDN & Edge"
        Vercel[Vercel Edge CDN]
        Static[Static Assets]
    end

    subgraph "Frontend Layer"
        NextJS[Next.js 14 App<br/>React 18 + TypeScript]
        SSR[Server-Side Rendering]
        ISR[Incremental Static Regeneration]
    end

    subgraph "API Gateway Layer"
        Gateway[API Gateway<br/>Rate Limiting & Auth]
        LoadBalancer[Load Balancer<br/>Nginx/HAProxy]
    end

    subgraph "Application Layer"
        API1[API Server 1<br/>Node.js + Express]
        API2[API Server 2<br/>Node.js + Express]
        API3[API Server N<br/>Node.js + Express]
        WS1[WebSocket Server 1<br/>Socket.io]
        WS2[WebSocket Server 2<br/>Socket.io]
    end

    subgraph "Background Processing"
        Queue[Job Queue<br/>BullMQ]
        Worker1[Worker 1<br/>Email & Notifications]
        Worker2[Worker 2<br/>AI Processing]
        Worker3[Worker 3<br/>Analytics & Reports]
    end

    subgraph "Data Layer"
        PGPrimary[(PostgreSQL<br/>Primary)]
        PGReplica1[(PostgreSQL<br/>Read Replica 1)]
        PGReplica2[(PostgreSQL<br/>Read Replica 2)]
        Redis[(Redis Cluster<br/>Cache & Pub/Sub)]
    end

    subgraph "Storage Layer"
        S3[S3/R2<br/>File Storage]
        CDNStorage[CloudFlare CDN<br/>Asset Delivery]
    end

    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4]
        Anthropic[Anthropic API<br/>Claude]
        Slack[Slack API]
        GitHub[GitHub API]
        Google[Google OAuth]
        SendGrid[SendGrid<br/>Email Service]
    end

    subgraph "Monitoring & Logging"
        Sentry[Sentry<br/>Error Tracking]
        DataDog[DataDog<br/>APM & Metrics]
        LogFlare[LogFlare<br/>Log Aggregation]
    end

    Browser -->|HTTPS| Vercel
    Mobile -->|HTTPS| Vercel
    Vercel -->|SSR| NextJS
    Vercel --> Static

    NextJS -->|API Calls| Gateway
    NextJS -->|WebSocket| LoadBalancer

    Gateway --> LoadBalancer
    LoadBalancer --> API1
    LoadBalancer --> API2
    LoadBalancer --> API3
    LoadBalancer --> WS1
    LoadBalancer --> WS2

    API1 --> PGPrimary
    API2 --> PGPrimary
    API3 --> PGReplica1
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis

    WS1 --> Redis
    WS2 --> Redis

    API1 --> Queue
    API2 --> Queue
    API3 --> Queue

    Queue --> Worker1
    Queue --> Worker2
    Queue --> Worker3

    Worker1 --> SendGrid
    Worker2 --> OpenAI
    Worker2 --> Anthropic
    Worker3 --> PGReplica2

    API1 --> S3
    API2 --> S3
    S3 --> CDNStorage

    API1 --> Slack
    API1 --> GitHub
    API1 --> Google

    API1 --> Sentry
    API2 --> Sentry
    API3 --> Sentry
    NextJS --> Sentry

    API1 --> DataDog
    API2 --> DataDog
    Worker1 --> DataDog
    Worker2 --> DataDog

    API1 --> LogFlare
    API2 --> LogFlare
    Worker1 --> LogFlare
```

### 1.2 Architecture Layers

| Layer               | Technology                        | Purpose                                | Scaling Strategy                  |
| ------------------- | --------------------------------- | -------------------------------------- | --------------------------------- |
| **Client**          | Browser (Chrome, Safari, Firefox) | User interface                         | N/A (client-side)                 |
| **CDN**             | Vercel Edge Network               | Static asset delivery, edge caching    | Global distribution               |
| **Frontend**        | Next.js 14, React 18, TypeScript  | Server-side rendering, UI components   | Serverless functions              |
| **API Gateway**     | Nginx / Custom middleware         | Rate limiting, authentication, routing | Horizontal scaling                |
| **Application**     | Node.js 20, Express 4             | Business logic, API endpoints          | Horizontal scaling (stateless)    |
| **WebSocket**       | Socket.io 4                       | Real-time communication                | Horizontal with Redis adapter     |
| **Background Jobs** | BullMQ, Redis                     | Async task processing                  | Worker-based scaling              |
| **Database**        | PostgreSQL 15                     | Persistent data storage                | Read replicas, connection pooling |
| **Cache**           | Redis 7                           | Session storage, caching, pub/sub      | Cluster mode                      |
| **Storage**         | S3 / Cloudflare R2                | File attachments, avatars              | Object storage (unlimited)        |
| **AI Services**     | OpenAI GPT-4, Anthropic Claude    | AI-powered features                    | API-based (external)              |
| **External APIs**   | Slack, GitHub, Google             | Integrations                           | API-based (external)              |

### 1.3 Network Flow

```mermaid
sequenceDiagram
    participant User
    participant CDN as Vercel Edge CDN
    participant FE as Next.js Frontend
    participant GW as API Gateway
    participant API as API Server
    participant Cache as Redis
    participant DB as PostgreSQL
    participant Queue as Job Queue
    participant Worker as Background Worker

    User->>CDN: HTTPS Request
    CDN->>FE: Route to Next.js
    FE->>User: Render SSR Page

    User->>GW: API Request (JWT Token)
    GW->>GW: Validate Token & Rate Limit
    GW->>API: Forward Request

    API->>Cache: Check Cache
    alt Cache Hit
        Cache-->>API: Return Cached Data
        API-->>User: Response
    else Cache Miss
        API->>DB: Query Database
        DB-->>API: Return Data
        API->>Cache: Store in Cache
        API-->>User: Response
    end

    API->>Queue: Enqueue Background Job
    Queue->>Worker: Process Job
    Worker->>DB: Update Database
```

---

## 2. Component Breakdown

### 2.1 Frontend Layer

#### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 (Server Components + Client Components)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **State Management**:
  - Zustand (global client state)
  - React Query / TanStack Query (server state)
  - Context API (localized state)
- **Form Handling**: React Hook Form + Zod validation
- **Real-time**: Socket.io Client
- **Animation**: Framer Motion
- **Charts**: Recharts / Victory
- **Markdown**: React Markdown + MDX

#### Responsibilities

1. **Server-Side Rendering (SSR)**
   - Initial page load performance
   - SEO optimization
   - Dynamic meta tags

2. **Client-Side Interactivity**
   - Real-time task updates via WebSocket
   - Optimistic UI updates
   - Drag-and-drop functionality
   - Form validation and submission

3. **State Management**
   - User session (Zustand)
   - Task board state (React Query + Zustand)
   - WebSocket connection state (Zustand)
   - Form state (React Hook Form)

4. **Offline Capabilities**
   - Service Worker for offline page access
   - IndexedDB for offline task cache
   - Background sync for queued actions
   - Network status detection

5. **Performance Optimization**
   - Code splitting and lazy loading
   - Image optimization (Next.js Image)
   - Route prefetching
   - Memoization (useMemo, useCallback, React.memo)

#### File Structure

```
apps/web/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes (login, register)
│   ├── (dashboard)/            # Dashboard routes
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── sprints/
│   ├── api/                    # API routes (for webhooks, etc.)
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── features/               # Feature-specific components
│   │   ├── tasks/
│   │   ├── projects/
│   │   └── sprints/
│   └── shared/                 # Shared components
├── lib/
│   ├── api/                    # API client
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand stores
│   ├── utils/                  # Utility functions
│   └── websocket/              # WebSocket client
├── types/                      # TypeScript types
└── public/                     # Static assets
```

#### State Management Strategy

**Zustand Store Structure**:

```typescript
// stores/auth.ts
interface AuthStore {
  user: User | null;
  tokens: Tokens | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// stores/board.ts
interface BoardStore {
  tasks: Task[];
  filters: FilterState;
  viewMode: 'board' | 'list' | 'calendar';
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  optimisticUpdate: (id: string, updates: Partial<Task>) => void;
  revertOptimistic: (id: string) => void;
}

// stores/websocket.ts
interface WebSocketStore {
  connected: boolean;
  socket: Socket | null;
  rooms: string[];
  connect: () => void;
  disconnect: () => void;
  joinRoom: (room: string) => void;
  emit: (event: string, data: any) => void;
}
```

**React Query Configuration**:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});
```

#### Real-Time Update Handling

```typescript
// WebSocket event handlers
useEffect(() => {
  socket.on('TASK_UPDATED', (data) => {
    // Update React Query cache
    queryClient.setQueryData(['tasks', data.taskId], (old) => ({
      ...old,
      ...data.task,
    }));

    // Update Zustand store
    updateTask(data.taskId, data.task);

    // Show toast notification
    if (data.userId !== currentUser.id) {
      toast.info(`${data.userName} updated task`);
    }
  });

  return () => {
    socket.off('TASK_UPDATED');
  };
}, [socket]);
```

#### Offline Support

```typescript
// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// IndexedDB for offline cache
const db = await openDB('teamflow-cache', 1, {
  upgrade(db) {
    db.createObjectStore('tasks', { keyPath: 'id' });
    db.createObjectStore('projects', { keyPath: 'id' });
  },
});

// Background sync for queued actions
if ('sync' in registration) {
  await registration.sync.register('sync-tasks');
}
```

---

### 2.2 API Layer

#### Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Validation**: Zod
- **Authentication**: Passport.js + JWT
- **ORM**: Prisma 5
- **API Documentation**: Swagger / OpenAPI 3
- **Testing**: Jest + Supertest

#### Responsibilities

1. **Request Handling**
   - RESTful API endpoints
   - Request validation
   - Authentication & authorization
   - Rate limiting
   - CORS configuration

2. **Business Logic**
   - Task CRUD operations
   - Sprint management
   - Project operations
   - User management
   - Integration orchestration

3. **Data Access**
   - Database queries via Prisma
   - Cache read/write
   - File storage operations
   - External API calls

4. **Error Handling**
   - Centralized error handling
   - Error logging
   - User-friendly error messages
   - Error recovery

#### File Structure

```
apps/api/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/                 # API routes
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   ├── projects.ts
│   │   ├── sprints.ts
│   │   └── workspaces.ts
│   ├── controllers/            # Request controllers
│   │   ├── taskController.ts
│   │   ├── projectController.ts
│   │   └── sprintController.ts
│   ├── services/               # Business logic
│   │   ├── taskService.ts
│   │   ├── aiService.ts
│   │   └── integrationService.ts
│   ├── models/                 # Prisma models (generated)
│   ├── utils/                  # Utility functions
│   │   ├── jwt.ts
│   │   ├── validation.ts
│   │   └── logger.ts
│   ├── types/                  # TypeScript types
│   └── index.ts                # Application entry point
├── prisma/
│   ├── schema.prisma           # Prisma schema
│   └── migrations/             # Database migrations
└── tests/                      # Test files
```

#### Middleware Stack

```typescript
// Application middleware setup
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS
app.use(express.json({ limit: '10mb' })); // JSON parsing
app.use(compression()); // Response compression
app.use(rateLimiter); // Rate limiting
app.use(requestLogger); // Request logging
app.use(errorHandler); // Error handling
```

#### Authentication Middleware

```typescript
// JWT authentication
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Check token blacklist
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token revoked');
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check user session in cache
    const cachedUser = await redis.get(`user:${decoded.userId}:session`);
    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
    } else {
      // Fetch from database and cache
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      await redis.setex(`user:${user.id}:session`, 900, JSON.stringify(user));
      req.user = user;
    }

    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token'));
  }
};
```

#### Rate Limiting Strategy

```typescript
// Rate limiter configuration
const rateLimiters = {
  // Global default: 100 requests per minute
  default: rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
    },
  }),

  // Auth endpoints: 10 requests per minute
  auth: rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.ip,
  }),

  // AI endpoints: 20 requests per hour per workspace
  ai: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => `${req.user.workspaceId}`,
  }),

  // File upload: 10 uploads per hour
  upload: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
  }),
};

// Apply rate limiters
app.use('/api/auth', rateLimiters.auth);
app.use('/api/tasks/:id/ai-breakdown', rateLimiters.ai);
app.use('/api/tasks/:id/attachments', rateLimiters.upload);
app.use('/api', rateLimiters.default);
```

#### Request Validation

```typescript
// Zod schema for task creation
const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(50000).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'blocked', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  storyPoints: z.number().int().min(1).max(21).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      } else {
        next(error);
      }
    }
  };
};

// Usage in route
router.post('/tasks', authenticate, validateRequest(createTaskSchema), taskController.createTask);
```

#### Error Handling

```typescript
// Custom error classes
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// Global error handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn({
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
        requestId: req.id,
      },
    });
  }

  // Unexpected errors
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Send to Sentry
  Sentry.captureException(err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.id,
    },
  });
};
```

#### Logging Approach

```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'teamflow-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      requestId: req.id,
    });
  });

  next();
};
```

---

### 2.3 Database Layer

#### Technology Stack

- **Database**: PostgreSQL 15
- **ORM**: Prisma 5
- **Connection Pooling**: PgBouncer
- **Migrations**: Prisma Migrate
- **Backup**: Automated daily backups

#### Schema Design Principles

1. **Normalization**: 3NF for core entities
2. **Denormalization**: Calculated fields for performance (cached)
3. **Indexing**: Strategic indexes on frequently queried columns
4. **Constraints**: Foreign keys, unique constraints, check constraints
5. **Soft Deletes**: `deletedAt` timestamp for recoverable deletions
6. **Audit Trail**: `createdAt`, `updatedAt`, `createdBy` on all tables
7. **Versioning**: `version` column for optimistic locking

#### Prisma Schema (Excerpt)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

model User {
  id                    String   @id @default(uuid())
  email                 String   @unique
  name                  String
  passwordHash          String?
  avatar                String?
  provider              String   @default("email")
  providerId            String?
  emailVerified         Boolean  @default(false)
  emailVerifiedAt       DateTime?
  lastLoginAt           DateTime?
  failedLoginAttempts   Int      @default(0)
  lockedUntil           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  workspaceMembers      WorkspaceMember[]
  createdTasks          Task[]    @relation("TaskCreator")
  assignedTasks         TaskAssignee[]
  comments              Comment[]
  activities            Activity[]
  uploadedAttachments   Attachment[]

  @@index([email])
  @@index([provider, providerId])
  @@map("users")
}

model Task {
  id                    String   @id @default(uuid())
  projectId             String
  title                 String
  description           String?  @db.Text
  status                TaskStatus @default(TODO)
  priority              TaskPriority @default(MEDIUM)
  storyPoints           Int?
  dueDate               DateTime?
  position              Int
  version               Int      @default(1)
  createdBy             String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  project               Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator               User     @relation("TaskCreator", fields: [createdBy], references: [id], onDelete: SetNull)
  assignees             TaskAssignee[]
  labels                TaskLabel[]
  comments              Comment[]
  attachments           Attachment[]
  subtasks              Subtask[]
  sprintTasks           SprintTask[]
  activities            Activity[]

  @@index([projectId, status, position])
  @@index([createdBy])
  @@index([dueDate])
  @@index([updatedAt])
  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  DONE
  ARCHIVED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

#### Indexing Strategy

```sql
-- Core performance indexes
CREATE INDEX idx_task_board ON tasks(project_id, status, position);
CREATE INDEX idx_task_assignee ON task_assignees(user_id);
CREATE INDEX idx_task_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_task_updated ON tasks(updated_at DESC);

-- Full-text search indexes
CREATE INDEX idx_task_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_comment_search ON comments USING gin(to_tsvector('english', content));

-- Activity feed indexes
CREATE INDEX idx_activity_workspace ON activities(workspace_id, created_at DESC);
CREATE INDEX idx_activity_entity ON activities(entity_type, entity_id, created_at DESC);

-- Sprint queries
CREATE INDEX idx_sprint_project ON sprints(project_id, status);
CREATE INDEX idx_sprint_dates ON sprints(start_date, end_date);

-- Workspace member access
CREATE UNIQUE INDEX idx_workspace_member ON workspace_members(user_id, workspace_id);
CREATE INDEX idx_workspace_member_role ON workspace_members(workspace_id, role);

-- Composite indexes for common queries
CREATE INDEX idx_task_project_status_priority ON tasks(project_id, status, priority);
CREATE INDEX idx_task_assignee_status ON task_assignees(user_id, task_id) INCLUDE (status);
```

#### Connection Pooling

```typescript
// Prisma client configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pooling via PgBouncer
// DATABASE_URL=postgresql://user:pass@localhost:6432/teamflow?pgbouncer=true

// Connection pool settings (PgBouncer config)
// pool_mode = transaction
// max_client_conn = 1000
// default_pool_size = 25
// reserve_pool_size = 5
// reserve_pool_timeout = 3
```

#### Query Optimization

```typescript
// Use select to fetch only needed fields
const task = await prisma.task.findUnique({
  where: { id: taskId },
  select: {
    id: true,
    title: true,
    status: true,
    assignees: {
      select: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    },
  },
});

// Use pagination for large result sets
const tasks = await prisma.task.findMany({
  where: { projectId },
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});

// Use transactions for related updates
await prisma.$transaction([
  prisma.task.update({
    where: { id: taskId },
    data: { status: 'done', version: { increment: 1 } },
  }),
  prisma.activity.create({
    data: {
      action: 'status_changed',
      taskId,
      userId,
      changes: { status: { from: 'in_progress', to: 'done' } },
    },
  }),
]);

// Use read replicas for read-heavy queries
const analytics = await prisma.$queryRaw`
  SELECT * FROM tasks WHERE project_id = ${projectId}
`.withReplica(); // Custom Prisma extension
```

#### Backup Strategy

1. **Automated Daily Backups**
   - Full backup daily at 2 AM UTC
   - Retention: 30 days
   - Storage: S3 with versioning

2. **Point-in-Time Recovery**
   - WAL archiving enabled
   - Recovery window: 7 days

3. **Backup Verification**
   - Weekly restore tests to staging
   - Automated integrity checks

4. **Disaster Recovery**
   - RTO: 4 hours
   - RPO: 1 hour (via WAL replay)

---

### 2.4 Cache Layer

#### Technology Stack

- **Cache**: Redis 7 (Cluster mode)
- **Client**: ioredis
- **Data Structures**: Strings, Hashes, Sets, Sorted Sets, Pub/Sub

#### What to Cache

| Data Type           | Key Pattern                          | TTL      | Invalidation Strategy     |
| ------------------- | ------------------------------------ | -------- | ------------------------- |
| User Sessions       | `user:{userId}:session`              | 15 min   | On logout, token refresh  |
| Task Data           | `task:{taskId}`                      | 5 min    | On task update            |
| Project Metadata    | `project:{projectId}`                | 10 min   | On project update         |
| Backlog Tasks       | `project:{projectId}:backlog`        | 3 min    | On task creation/deletion |
| Sprint Data         | `sprint:{sprintId}`                  | 10 min   | On sprint update          |
| User Permissions    | `permissions:{userId}:{workspaceId}` | 30 min   | On role change            |
| Rate Limit Counters | `rate:{ip}:{endpoint}`               | 1-60 min | TTL-based expiry          |
| WebSocket Rooms     | `room:{roomId}:members`              | N/A      | On join/leave             |
| Online Users        | `presence:{workspaceId}`             | N/A      | On connect/disconnect     |
| API Response Cache  | `api:{endpoint}:{params}`            | 1-5 min  | On data mutation          |

#### Cache Configuration

```typescript
// Redis client setup
import Redis from 'ioredis';

const redis = new Redis.Cluster(
  [
    { host: 'redis-node-1', port: 6379 },
    { host: 'redis-node-2', port: 6379 },
    { host: 'redis-node-3', port: 6379 },
  ],
  {
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
      db: 0,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    },
    clusterRetryStrategy: (times) => Math.min(times * 100, 2000),
  }
);

// Pub/Sub client (separate connection)
const subscriber = redis.duplicate();
```

#### Caching Patterns

**Cache-Aside Pattern** (Lazy Loading):

```typescript
async function getTask(taskId: string): Promise<Task> {
  // 1. Check cache
  const cached = await redis.get(`task:${taskId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Query database
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignees: true, labels: true },
  });

  if (!task) {
    throw new NotFoundError('Task');
  }

  // 3. Store in cache
  await redis.setex(`task:${taskId}`, 300, JSON.stringify(task));

  return task;
}
```

**Write-Through Pattern**:

```typescript
async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  // 1. Update database
  const task = await prisma.task.update({
    where: { id: taskId },
    data: updates,
  });

  // 2. Update cache
  await redis.setex(`task:${taskId}`, 300, JSON.stringify(task));

  // 3. Invalidate related caches
  await redis.del(`project:${task.projectId}:backlog`);

  return task;
}
```

**Pub/Sub for Cache Invalidation**:

```typescript
// Publisher (API server)
await redis.publish(
  'cache:invalidate',
  JSON.stringify({
    pattern: `task:${taskId}`,
    reason: 'update',
  })
);

// Subscriber (all API servers)
subscriber.subscribe('cache:invalidate');
subscriber.on('message', async (channel, message) => {
  const { pattern, reason } = JSON.parse(message);
  await redis.del(pattern);
  logger.info(`Cache invalidated: ${pattern} (${reason})`);
});
```

#### Cache Invalidation Strategy

1. **TTL-Based Expiry**
   - All cache entries have TTL
   - Prevents stale data
   - Automatic cleanup

2. **Event-Driven Invalidation**
   - On data mutation, invalidate related caches
   - Pub/Sub for multi-instance invalidation

3. **Version-Based Invalidation**
   - Include version in cache key: `task:{taskId}:v{version}`
   - Increment version on update

4. **Cache Stampede Prevention**

```typescript
async function getCachedData(key: string, fetchFn: () => Promise<any>) {
  // Check cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Acquire lock to prevent stampede
  const lockKey = `lock:${key}`;
  const lock = await redis.set(lockKey, '1', 'EX', 10, 'NX');

  if (lock) {
    try {
      // Fetch fresh data
      const data = await fetchFn();
      await redis.setex(key, 300, JSON.stringify(data));
      return data;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // Wait and retry
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getCachedData(key, fetchFn);
  }
}
```

---

### 2.5 WebSocket Layer

#### Technology Stack

- **WebSocket Server**: Socket.io 4
- **Adapter**: @socket.io/redis-adapter (for multi-instance)
- **Authentication**: JWT-based
- **Protocol**: WebSocket with fallback to long-polling

#### Room Structure

```
workspace:{workspaceId}     - All workspace updates
project:{projectId}         - Project-specific updates
task:{taskId}               - Task-specific updates (comments, etc.)
user:{userId}               - User-specific notifications
sprint:{sprintId}           - Sprint-specific updates
```

#### Socket.io Server Setup

```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verify } from 'jsonwebtoken';

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Redis adapter for horizontal scaling
const pubClient = redis.duplicate();
const subClient = redis.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.user = await getUser(decoded.userId);

    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Connection handler
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`);

  // Register presence
  registerUserPresence(socket.userId, socket.id);

  // Handle room joins
  socket.on('join', async (rooms: string[]) => {
    for (const room of rooms) {
      // Verify access
      const hasAccess = await verifyRoomAccess(socket.userId, room);
      if (hasAccess) {
        await socket.join(room);
        logger.info(`User ${socket.userId} joined room: ${room}`);
      }
    }

    socket.emit('joined', rooms);
  });

  // Handle room leaves
  socket.on('leave', async (rooms: string[]) => {
    for (const room of rooms) {
      await socket.leave(room);
    }
    socket.emit('left', rooms);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.userId}`);
    unregisterUserPresence(socket.userId, socket.id);
  });

  // Heartbeat
  socket.on('ping', () => {
    socket.emit('pong');
  });
});
```

#### Event Types

See [API Contracts - WebSocket Events](../model/api-contracts.md#10-websocket-events) for complete event list.

**Broadcasting Events**:

```typescript
// Broadcast to specific room
io.to(`project:${projectId}`).emit('TASK_CREATED', {
  taskId,
  task,
  userId,
  userName,
  timestamp: new Date().toISOString(),
});

// Broadcast to multiple rooms
io.to([`workspace:${workspaceId}`, `project:${projectId}`]).emit('PROJECT_UPDATED', data);

// Broadcast to all except sender
socket.broadcast.to(`task:${taskId}`).emit('COMMENT_CREATED', data);

// Emit to specific user
io.to(`user:${userId}`).emit('NOTIFICATION', notification);
```

#### Presence Tracking

```typescript
// Register user presence
async function registerUserPresence(userId: string, socketId: string) {
  // Add socket to user's connection set
  await redis.sadd(`user:${userId}:connections`, socketId);

  // Set user status to online
  await redis.set(`user:${userId}:status`, 'online');

  // Broadcast presence update
  const workspaces = await getUserWorkspaces(userId);
  for (const workspaceId of workspaces) {
    io.to(`workspace:${workspaceId}`).emit('USER_ONLINE', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Unregister user presence
async function unregisterUserPresence(userId: string, socketId: string) {
  // Remove socket from connections
  await redis.srem(`user:${userId}:connections`, socketId);

  // Check remaining connections
  const remaining = await redis.scard(`user:${userId}:connections`);

  if (remaining === 0) {
    // User fully offline
    await redis.set(`user:${userId}:status`, 'offline');
    await redis.set(`user:${userId}:lastSeen`, Date.now());

    // Broadcast offline status
    const workspaces = await getUserWorkspaces(userId);
    for (const workspaceId of workspaces) {
      io.to(`workspace:${workspaceId}`).emit('USER_OFFLINE', {
        userId,
        lastSeen: Date.now(),
      });
    }
  }
}
```

#### Reconnection Handling

```typescript
// Client-side reconnection
socket.on('disconnect', () => {
  // Exponential backoff reconnection
  setTimeout(
    () => {
      socket.connect();
    },
    Math.min(1000 * 2 ** reconnectAttempts, 30000)
  );
});

socket.on('connect', () => {
  reconnectAttempts = 0;

  // Rejoin rooms
  socket.emit('join', cachedRooms);

  // Fetch missed updates
  const lastSyncTimestamp = localStorage.getItem('lastSync');
  if (lastSyncTimestamp) {
    fetchMissedUpdates(lastSyncTimestamp);
  }
});
```

#### Scaling Strategy

1. **Redis Adapter**: Enables multi-instance WebSocket servers
2. **Sticky Sessions**: Use IP-based sticky sessions at load balancer
3. **Horizontal Scaling**: Scale WebSocket servers independently
4. **Monitoring**: Track connection counts, room sizes, event rates

```typescript
// Sticky session configuration (Nginx)
upstream websocket_backend {
  ip_hash;
  server ws-server-1:3000;
  server ws-server-2:3000;
  server ws-server-3:3000;
}
```

---

### 2.6 AI Service Layer

#### Technology Stack

- **Primary**: OpenAI GPT-4
- **Fallback**: Anthropic Claude 3
- **Client**: Official SDKs (openai, @anthropic-ai/sdk)
- **Retry Logic**: Exponential backoff
- **Caching**: Redis for response caching

#### API Client Setup

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI service wrapper
export class AIService {
  async generateTaskBreakdown(task: Task): Promise<SubtaskSuggestion[]> {
    try {
      // Try OpenAI first
      return await this.openAIBreakdown(task);
    } catch (error) {
      logger.warn('OpenAI failed, falling back to Anthropic', error);
      return await this.anthropicBreakdown(task);
    }
  }

  private async openAIBreakdown(task: Task): Promise<SubtaskSuggestion[]> {
    const cacheKey = `ai:breakdown:${task.id}:${task.updatedAt}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const prompt = this.buildBreakdownPrompt(task);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a project management assistant...',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const suggestions = this.parseBreakdownResponse(completion.choices[0].message.content);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(suggestions));

    // Log usage
    await this.logAIUsage({
      model: 'gpt-4',
      tokensUsed: completion.usage.total_tokens,
      cost: this.calculateCost('gpt-4', completion.usage.total_tokens),
    });

    return suggestions;
  }
}
```

#### Prompt Engineering

```typescript
private buildBreakdownPrompt(task: Task): string {
  return `
Analyze the following task and break it down into smaller, actionable subtasks.

Task Details:
- Title: ${task.title}
- Description: ${task.description}
- Project Type: ${task.project.settings.template}
- Estimated Story Points: ${task.storyPoints || 'Unknown'}

Requirements:
1. Generate 3-10 subtasks
2. Each subtask should be specific and actionable
3. Order subtasks logically (dependencies considered)
4. Estimate effort for each subtask (1-5 hours)
5. Assign confidence score (0.0-1.0)

Output Format (JSON):
{
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "Detailed description",
      "estimatedHours": 2,
      "confidence": 0.95,
      "order": 0
    }
  ]
}
  `.trim();
}
```

#### Response Caching

```typescript
// Cache AI responses based on input hash
async function getCachedAIResponse(operation: string, input: any): Promise<any> {
  const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');

  const cacheKey = `ai:${operation}:${inputHash}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info('AI cache hit', { operation, inputHash });
    return JSON.parse(cached);
  }

  return null;
}
```

#### Cost Optimization

1. **Response Caching**: Cache identical requests for 1 hour
2. **Prompt Optimization**: Minimize token usage in prompts
3. **Model Selection**: Use GPT-3.5-turbo for simpler tasks
4. **Batch Processing**: Group similar requests
5. **Rate Limiting**: 20 requests per hour per workspace
6. **Usage Tracking**: Monitor costs per workspace

```typescript
interface AIUsage {
  workspaceId: string;
  model: string;
  tokensUsed: number;
  cost: number;
  operation: string;
  timestamp: Date;
}

async function logAIUsage(usage: AIUsage) {
  await prisma.aiUsage.create({ data: usage });

  // Check monthly budget
  const monthlyUsage = await prisma.aiUsage.aggregate({
    where: {
      workspaceId: usage.workspaceId,
      timestamp: { gte: startOfMonth() },
    },
    _sum: { cost: true },
  });

  if (monthlyUsage._sum.cost > WORKSPACE_MONTHLY_LIMIT) {
    throw new Error('AI budget exceeded for this month');
  }
}
```

#### Fallback Handling

```typescript
async function callAIWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  try {
    return await primaryFn();
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      logger.warn('OpenAI API error, using fallback', {
        status: error.status,
        message: error.message,
      });

      if (error.status === 429) {
        // Rate limit - wait and retry
        await sleep(5000);
        return await primaryFn();
      }

      // Use fallback for other errors
      return await fallbackFn();
    }

    throw error;
  }
}
```

---

### 2.7 Background Jobs

#### Technology Stack

- **Queue**: BullMQ (Redis-based)
- **Scheduler**: Node-cron
- **Workers**: Separate Node.js processes
- **Monitoring**: Bull Board (web UI)

#### Job Types

| Job Type              | Priority | Retry   | Timeout | Rate Limit |
| --------------------- | -------- | ------- | ------- | ---------- |
| Email Sending         | High     | 3 times | 30s     | 100/min    |
| AI Processing         | Medium   | 2 times | 60s     | 20/hour    |
| Analytics Calculation | Low      | 1 time  | 120s    | -          |
| Data Cleanup          | Low      | 0 times | 300s    | -          |
| Integration Sync      | Medium   | 3 times | 60s     | 50/hour    |
| Notification Dispatch | High     | 2 times | 15s     | 200/min    |

#### Queue Setup

```typescript
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

// Email queue
const emailQueue = new Queue('email', { connection });

// AI processing queue
const aiQueue = new Queue('ai-processing', { connection });

// Analytics queue
const analyticsQueue = new Queue('analytics', { connection });
```

#### Job Definitions

```typescript
// Add email job
export async function sendEmail(to: string, subject: string, body: string) {
  await emailQueue.add(
    'send',
    { to, subject, body },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    }
  );
}

// Add AI processing job
export async function processAIBreakdown(taskId: string, userId: string, options: any) {
  const job = await aiQueue.add(
    'task-breakdown',
    { taskId, userId, options },
    {
      attempts: 2,
      timeout: 60000,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );

  return job.id;
}
```

#### Workers

```typescript
// Email worker
const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    const { to, subject, body } = job.data;

    logger.info('Processing email job', { jobId: job.id, to });

    await sendGridClient.send({
      to,
      from: 'noreply@teamflow.app',
      subject,
      html: body,
    });

    logger.info('Email sent successfully', { jobId: job.id });
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000, // 100 emails per minute
    },
  }
);

// AI worker
const aiWorker = new Worker(
  'ai-processing',
  async (job: Job) => {
    const { taskId, userId, options } = job.data;

    logger.info('Processing AI job', { jobId: job.id, taskId });

    // Update job progress
    await job.updateProgress(10);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    await job.updateProgress(30);

    const suggestions = await aiService.generateTaskBreakdown(task, options);
    await job.updateProgress(80);

    // Store results
    await redis.setex(`job:${job.id}:result`, 3600, JSON.stringify({ suggestions }));

    await job.updateProgress(100);

    return { suggestions };
  },
  {
    connection,
    concurrency: 2,
    limiter: {
      max: 20,
      duration: 3600000, // 20 AI requests per hour
    },
  }
);

// Analytics worker
const analyticsWorker = new Worker(
  'analytics',
  async (job: Job) => {
    const { type, projectId, timeRange } = job.data;

    switch (type) {
      case 'calculate-velocity':
        return await calculateProjectVelocity(projectId, timeRange);
      case 'generate-burndown':
        return await generateBurndownData(projectId);
      case 'team-performance':
        return await calculateTeamPerformance(projectId);
      default:
        throw new Error(`Unknown analytics type: ${type}`);
    }
  },
  {
    connection,
    concurrency: 3,
  }
);
```

#### Retry Strategy

```typescript
// Exponential backoff with jitter
const retryConfig = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s
  },
};

// Custom retry logic
emailWorker.on('failed', async (job, error) => {
  logger.error('Job failed', {
    jobId: job.id,
    attempts: job.attemptsMade,
    error: error.message,
  });

  if (job.attemptsMade >= 3) {
    // Send alert to admin
    await sendAdminAlert({
      type: 'job-failed',
      jobId: job.id,
      error: error.message,
    });
  }
});
```

#### Scheduled Jobs

```typescript
import cron from 'node-cron';

// Daily cleanup job (2 AM UTC)
cron.schedule('0 2 * * *', async () => {
  logger.info('Running daily cleanup job');

  // Clean up old activity logs
  await prisma.activity.deleteMany({
    where: {
      createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  });

  // Clean up expired tokens
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  // Clean up soft-deleted comments
  await prisma.comment.deleteMany({
    where: {
      deletedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  logger.info('Daily cleanup completed');
});

// Hourly analytics update
cron.schedule('0 * * * *', async () => {
  const activeProjects = await prisma.project.findMany({
    where: { archived: false },
    select: { id: true },
  });

  for (const project of activeProjects) {
    await analyticsQueue.add('calculate-velocity', {
      type: 'calculate-velocity',
      projectId: project.id,
      timeRange: 'last-30-days',
    });
  }
});
```

#### Monitoring

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(aiQueue),
    new BullMQAdapter(analyticsQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

---

## 3. Data Flow

### 3.1 User Creates Task

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant CDN
    participant API
    participant Validator
    participant DB
    participant Cache
    participant Queue
    participant WS

    User->>Frontend: Fills task form & clicks submit
    Frontend->>Frontend: Client-side validation (Zod)

    alt Validation fails
        Frontend->>User: Show inline errors
    else Valid
        Frontend->>Frontend: Optimistic UI update (add task to board)
        Frontend->>API: POST /api/tasks {data}

        API->>API: Verify JWT token
        API->>Validator: Validate request body
        Validator-->>API: Valid

        API->>Cache: Check permissions (user:proj access)
        Cache-->>API: Authorized

        API->>DB: BEGIN TRANSACTION
        API->>DB: INSERT INTO tasks
        API->>DB: INSERT INTO task_assignees
        API->>DB: INSERT INTO activity (log)
        API->>DB: COMMIT

        DB-->>API: Task created (id, version)

        API->>Cache: SET task:{id} (TTL: 5min)
        API->>Cache: INCR project:{id}:task_count

        API->>Queue: Enqueue notification jobs
        API->>WS: Publish TASK_CREATED event

        WS->>Frontend: Broadcast to project room
        Frontend->>Frontend: Confirm optimistic update
        Frontend->>User: Show success toast
    end
```

### 3.2 Real-Time Update Propagation

```mermaid
flowchart TD
    A[User A: Update task status] --> B[Frontend: Optimistic update]
    B --> C[API: PATCH /api/tasks/:id]
    C --> D{Version check}
    D -->|Conflict| E[Return 409]
    E --> F[Frontend: Show conflict modal]
    D -->|OK| G[Update DB + version++]
    G --> H[Update cache]
    H --> I[Publish to Redis Pub/Sub]
    I --> J[All API servers receive event]
    J --> K[Broadcast via WebSocket]
    K --> L[Frontend B: Receive WS message]
    L --> M[Update React Query cache]
    M --> N[Update UI]
    K --> O[Frontend C: Receive WS message]
    O --> P[Update React Query cache]
    P --> Q[Update UI]
```

### 3.3 AI Request Processing

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API
    participant Queue
    participant Worker
    participant AI as OpenAI API
    participant Cache

    User->>Frontend: Clicks "AI Breakdown"
    Frontend->>API: POST /api/tasks/:id/ai-breakdown

    API->>API: Check AI quota
    API->>Queue: Enqueue ai-processing job
    Queue-->>API: Return job ID

    API-->>Frontend: 202 Accepted {jobId}
    Frontend->>Frontend: Show loading state
    Frontend->>Frontend: Start polling /api/jobs/:id

    Queue->>Worker: Dispatch job
    Worker->>Cache: Check cache (input hash)

    alt Cache hit
        Cache-->>Worker: Return cached response
    else Cache miss
        Worker->>AI: POST /v1/chat/completions
        AI-->>Worker: AI response
        Worker->>Cache: Store response (1 hour TTL)
    end

    Worker->>Cache: SET job:{id}:result
    Worker->>Cache: SET job:{id}:status "completed"

    Frontend->>API: Poll GET /api/jobs/:id
    API->>Cache: GET job:{id}:status
    Cache-->>API: "completed"
    API->>Cache: GET job:{id}:result
    Cache-->>API: {suggestions}
    API-->>Frontend: 200 OK {suggestions}

    Frontend->>User: Display AI suggestions
```

### 3.4 File Upload Handling

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API
    participant S3
    participant Queue
    participant Worker
    participant Virus as ClamAV

    User->>Frontend: Drag & drop file
    Frontend->>Frontend: Validate (size, type)
    Frontend->>API: POST /api/tasks/:id/attachments/presigned

    API->>API: Check attachment limit
    API->>S3: Generate presigned URL
    S3-->>API: Presigned URL (5min expiry)
    API-->>Frontend: {uploadUrl, uploadId}

    Frontend->>S3: PUT file directly to S3
    S3-->>Frontend: Upload progress events
    Frontend->>User: Show progress bar
    S3-->>Frontend: 200 OK (upload complete)

    Frontend->>API: POST /api/tasks/:id/attachments/:uploadId/confirm
    API->>S3: Verify file exists
    S3-->>API: File metadata

    API->>Queue: Enqueue virus-scan job
    API->>API: Create attachment record (pending)
    API-->>Frontend: 201 Created {attachment}

    Queue->>Worker: Dispatch virus-scan
    Worker->>S3: Download file
    Worker->>Virus: Scan file

    alt Virus detected
        Virus-->>Worker: Infected
        Worker->>S3: Delete file
        Worker->>API: Mark attachment as infected
        API->>Frontend: WebSocket: ATTACHMENT_REMOVED
    else Clean
        Virus-->>Worker: Clean
        Worker->>API: Mark attachment as clean
        API->>Frontend: WebSocket: ATTACHMENT_SCANNED
    end
```

---

## 4. Scalability Strategy

### 4.1 Horizontal Scaling

#### Load Balancing

```nginx
# Nginx load balancer configuration
upstream api_backend {
    least_conn;
    server api-1:3000 weight=3;
    server api-2:3000 weight=3;
    server api-3:3000 weight=2;

    keepalive 32;
}

upstream websocket_backend {
    ip_hash;  # Sticky sessions for WebSocket
    server ws-1:3001;
    server ws-2:3001;
    server ws-3:3001;
}

server {
    listen 443 ssl http2;
    server_name api.teamflow.app;

    # API requests
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket requests
    location /ws/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

#### Auto-Scaling Rules

**API Servers**:

- Min instances: 2
- Max instances: 10
- Scale up: CPU > 70% for 3 minutes
- Scale down: CPU < 30% for 10 minutes

**WebSocket Servers**:

- Min instances: 2
- Max instances: 6
- Scale up: Connection count > 5000 per instance
- Scale down: Connection count < 1000 per instance

**Background Workers**:

- Min instances: 1
- Max instances: 5
- Scale up: Queue length > 100
- Scale down: Queue length < 10

### 4.2 Database Scaling

#### Read Replicas

```typescript
// Prisma client with read replicas
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Primary (writes)
    },
  },
});

// Custom extension for read replicas
const prismaWithReplicas = prisma.$extends({
  client: {
    $replica: () => {
      return new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_REPLICA_URL, // Replica (reads)
          },
        },
      });
    },
  },
});

// Usage
// Writes to primary
await prisma.task.create({ data: taskData });

// Reads from replica
const tasks = await prismaWithReplicas.$replica().task.findMany({
  where: { projectId },
});
```

#### Connection Pooling

**PgBouncer Configuration**:

```ini
[databases]
teamflow = host=postgres-primary port=5432 dbname=teamflow

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 600
```

**Application Connection Pool**:

```typescript
// Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `postgresql://user:pass@pgbouncer:6432/teamflow?pgbouncer=true&connection_limit=25`,
    },
  },
});
```

#### Sharding Considerations (Future)

When database grows beyond single instance capacity:

1. **Horizontal Sharding by Workspace**:
   - Shard key: `workspace_id`
   - Each shard contains all data for subset of workspaces
   - Route queries based on workspace context

2. **Vertical Partitioning**:
   - Separate activity logs to different database
   - Move attachments metadata to separate store

3. **Citus Extension**:
   - Use Citus for distributed PostgreSQL
   - Transparent sharding with minimal code changes

### 4.3 Cache Scaling

#### Redis Cluster

```typescript
// Redis cluster configuration
const redis = new Redis.Cluster(
  [
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 },
    { host: 'redis-4', port: 6379 },
    { host: 'redis-5', port: 6379 },
    { host: 'redis-6', port: 6379 },
  ],
  {
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
    },
    scaleReads: 'slave', // Read from replicas
    clusterRetryStrategy: (times) => Math.min(times * 100, 2000),
  }
);
```

**Cluster Topology**:

- 3 master nodes (sharded by key hash)
- 3 replica nodes (one per master)
- Automatic failover
- Hash slot distribution: 16384 slots

### 4.4 CDN for Static Assets

**Vercel Edge Network**:

- Global CDN with 100+ edge locations
- Automatic HTTPS
- DDoS protection
- Cache static assets at edge

**Cache Headers**:

```typescript
// Next.js image optimization
export const metadata = {
  icons: {
    icon: '/favicon.ico',
  },
};

// Static assets (public folder)
// Cache-Control: public, max-age=31536000, immutable

// API responses (selective caching)
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
```

### 4.5 Performance Targets

| Metric                        | Target  | Current |
| ----------------------------- | ------- | ------- |
| **API Response Time (p95)**   | < 500ms | TBD     |
| **WebSocket Latency**         | < 100ms | TBD     |
| **Page Load Time (LCP)**      | < 2.5s  | TBD     |
| **Time to Interactive (TTI)** | < 3.5s  | TBD     |
| **Concurrent Users**          | 10,000+ | TBD     |
| **Tasks per Second**          | 1,000+  | TBD     |
| **Database Query Time (p95)** | < 50ms  | TBD     |
| **Cache Hit Rate**            | > 80%   | TBD     |

---

## 5. Security Architecture

### 5.1 Authentication

#### JWT Strategy

**Token Structure**:

```typescript
interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
  iat: number;
  exp: number; // 15 minutes
}

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  jti: string; // Unique token ID
  iat: number;
  exp: number; // 7-30 days
}
```

**Token Generation**:

```typescript
import jwt from 'jsonwebtoken';

export function generateTokens(user: User, rememberMe: boolean) {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'access',
    },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
      jti: randomUUID(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: rememberMe ? '30d' : '7d' }
  );

  return { accessToken, refreshToken };
}
```

**Token Storage**:

- Access token: Memory (JavaScript variable)
- Refresh token: HttpOnly cookie
- Never store tokens in localStorage (XSS vulnerability)

**Token Refresh Flow**:

```typescript
// Automatic token refresh on 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      try {
        const { data } = await axios.post('/api/auth/refresh');
        setAccessToken(data.accessToken);
        error.config.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 5.2 Authorization (RBAC)

#### Permission Model

```typescript
enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  roles: WorkspaceRole[];
}

const permissions: Permission[] = [
  // Workspace
  { resource: 'workspace', action: 'read', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'workspace', action: 'update', roles: ['owner'] },
  { resource: 'workspace', action: 'delete', roles: ['owner'] },

  // Project
  { resource: 'project', action: 'create', roles: ['owner', 'admin', 'member'] },
  { resource: 'project', action: 'read', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'project', action: 'update', roles: ['owner', 'admin'] },
  { resource: 'project', action: 'delete', roles: ['owner', 'admin'] },

  // Task
  { resource: 'task', action: 'create', roles: ['owner', 'admin', 'member'] },
  { resource: 'task', action: 'read', roles: ['owner', 'admin', 'member', 'viewer'] },
  { resource: 'task', action: 'update', roles: ['owner', 'admin', 'member'] }, // + assignee
  { resource: 'task', action: 'delete', roles: ['owner', 'admin'] }, // + creator

  // Integration
  { resource: 'integration', action: 'create', roles: ['owner', 'admin'] },
  { resource: 'integration', action: 'delete', roles: ['owner', 'admin'] },
];
```

**Authorization Middleware**:

```typescript
export const authorize = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const workspaceId = req.params.workspaceId || req.body.workspaceId;

      // Get user's role in workspace
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId,
          },
        },
      });

      if (!member) {
        throw new ForbiddenError('Not a workspace member');
      }

      // Check permission
      const permission = permissions.find((p) => p.resource === resource && p.action === action);

      if (!permission || !permission.roles.includes(member.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      // Attach role to request
      req.userRole = member.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Usage
router.post(
  '/workspaces/:workspaceId/projects',
  authenticate,
  authorize('project', 'create'),
  projectController.createProject
);
```

### 5.3 Data Encryption

#### At Rest

- **Database**: PostgreSQL transparent data encryption (TDE)
- **Backups**: Encrypted with AES-256
- **File Storage**: S3 server-side encryption (SSE-S3)
- **Secrets**: AWS Secrets Manager / HashiCorp Vault

#### In Transit

- **HTTPS**: TLS 1.3 with strong cipher suites
- **Database**: SSL/TLS encrypted connections
- **Redis**: TLS enabled for cluster communication
- **Internal Services**: mTLS for service-to-service

**TLS Configuration**:

```nginx
ssl_protocols TLSv1.3 TLSv1.2;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

### 5.4 API Security

#### CORS Configuration

```typescript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://teamflow.app',
      'https://www.teamflow.app',
      'https://staging.teamflow.app',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

#### Security Headers

```typescript
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.teamflow.app', 'wss://api.teamflow.app'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  })
);
```

#### Input Sanitization

```typescript
import sanitizeHtml from 'sanitize-html';

// Sanitize markdown content
export function sanitizeMarkdown(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt'],
      a: ['href', 'title', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

// SQL injection prevention (Prisma ORM handles this)
// XSS prevention (React escapes by default)
```

### 5.5 File Upload Security

```typescript
// File upload validation
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB per task

export async function validateFileUpload(file: Express.Multer.File, taskId: string): Promise<void> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError('File size exceeds 10MB limit');
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestError('File type not allowed');
  }

  // Check total task attachments size
  const totalSize = await prisma.attachment.aggregate({
    where: { taskId },
    _sum: { size: true },
  });

  if ((totalSize._sum.size || 0) + file.size > MAX_TOTAL_SIZE) {
    throw new BadRequestError('Total attachments exceed 50MB limit');
  }

  // Virus scan (async)
  await queueVirusScan(file.path);
}
```

### 5.6 Secret Management

```typescript
// Environment-specific secrets
// .env.production (not committed to git)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
OPENAI_API_KEY=...
SENDGRID_API_KEY=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

// Load secrets from environment
import dotenv from 'dotenv';
dotenv.config();

// Or use AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString;
}
```

---

## 6. Observability

### 6.1 Logging Strategy

#### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'teamflow-api',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage
logger.info('Task created', {
  taskId: task.id,
  projectId: task.projectId,
  userId: user.id,
  duration: Date.now() - startTime,
});

logger.error('Database query failed', {
  error: error.message,
  stack: error.stack,
  query: 'SELECT * FROM tasks',
  userId: user.id,
});
```

#### Log Levels

| Level     | Usage                                | Examples                               |
| --------- | ------------------------------------ | -------------------------------------- |
| **error** | Errors requiring immediate attention | Database connection failed, API errors |
| **warn**  | Warnings that may indicate issues    | Deprecated API usage, high latency     |
| **info**  | General informational messages       | User logged in, task created           |
| **http**  | HTTP request logs                    | API requests and responses             |
| **debug** | Detailed debugging information       | Variable values, function calls        |

#### Log Aggregation

**LogFlare Integration**:

```typescript
import { LogFlare } from 'logflare-transport-winston';

logger.add(
  new LogFlare({
    apiKey: process.env.LOGFLARE_API_KEY,
    sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
  })
);
```

### 6.2 Monitoring Metrics

#### Application Metrics

```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request counter
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Request duration
const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Active connections
const activeConnections = new Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections',
});

// Middleware to record metrics
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    requestCounter.inc({
      method: req.method,
      route: req.route?.path || 'unknown',
      status: res.statusCode,
    });
    requestDuration.observe({ method: req.method, route: req.route?.path || 'unknown' }, duration);
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### Key Metrics to Track

| Metric                            | Type      | Description           | Alert Threshold |
| --------------------------------- | --------- | --------------------- | --------------- |
| `http_requests_total`             | Counter   | Total API requests    | -               |
| `http_request_duration_seconds`   | Histogram | API response time     | p95 > 1s        |
| `http_errors_total`               | Counter   | API errors            | 10+ per minute  |
| `websocket_active_connections`    | Gauge     | Active WS connections | > 10,000        |
| `database_query_duration_seconds` | Histogram | DB query time         | p95 > 100ms     |
| `database_connections_active`     | Gauge     | Active DB connections | > 20            |
| `redis_commands_total`            | Counter   | Redis operations      | -               |
| `redis_hit_rate`                  | Gauge     | Cache hit rate        | < 70%           |
| `background_jobs_pending`         | Gauge     | Pending jobs          | > 1000          |
| `background_jobs_failed`          | Counter   | Failed jobs           | 10+ per hour    |
| `ai_requests_total`               | Counter   | AI API calls          | -               |
| `ai_request_duration_seconds`     | Histogram | AI response time      | p95 > 30s       |

### 6.3 Distributed Tracing

#### DataDog APM Integration

```typescript
import tracer from 'dd-trace';

tracer.init({
  service: 'teamflow-api',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  logInjection: true,
  analytics: true,
});

// Trace AI requests
import { Span } from 'dd-trace';

async function generateAIBreakdown(task: Task): Promise<Subtask[]> {
  const span = tracer.startSpan('ai.task_breakdown');
  span.setTag('task.id', task.id);
  span.setTag('task.title', task.title);

  try {
    const response = await openai.chat.completions.create({...});
    span.setTag('ai.tokens_used', response.usage.total_tokens);
    span.setTag('ai.model', 'gpt-4');

    return parseResponse(response);
  } catch (error) {
    span.setTag('error', true);
    span.setTag('error.message', error.message);
    throw error;
  } finally {
    span.finish();
  }
}
```

#### Trace Context Propagation

```typescript
// Add trace ID to logs
app.use((req, res, next) => {
  const traceId = tracer.scope().active()?.context().toTraceId();
  req.traceId = traceId;

  logger.defaultMeta = {
    ...logger.defaultMeta,
    traceId,
  };

  next();
});
```

### 6.4 Error Tracking

#### Sentry Integration

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  },
});

// Request handler (must be first)
app.use(Sentry.Handlers.requestHandler());

// Tracing handler
app.use(Sentry.Handlers.tracingHandler());

// Error handler (must be after routes)
app.use(Sentry.Handlers.errorHandler());

// Manual error capture
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      operation: 'task_creation',
      userId: user.id,
    },
    extra: {
      taskData: task,
    },
  });
  throw error;
}
```

### 6.5 Alerting Rules

#### DataDog Monitors

```yaml
# High error rate
- name: 'High API Error Rate'
  query: 'sum(last_5m):sum:http_errors_total{env:production}.as_rate() > 10'
  message: '@slack-ops API error rate is above 10 errors per minute'
  tags:
    - 'service:teamflow-api'
    - 'severity:critical'

# Slow API responses
- name: 'Slow API Response Time'
  query: 'avg(last_15m):avg:http_request_duration_seconds{env:production} > 1'
  message: '@pagerduty Average API response time is above 1 second'
  tags:
    - 'service:teamflow-api'
    - 'severity:warning'

# High database connections
- name: 'High Database Connection Usage'
  query: 'avg(last_5m):avg:database_connections_active{env:production} > 20'
  message: 'Database connection pool is above 80% capacity'
  tags:
    - 'service:teamflow-api'
    - 'severity:warning'

# Low cache hit rate
- name: 'Low Redis Cache Hit Rate'
  query: 'avg(last_30m):avg:redis_hit_rate{env:production} < 0.7'
  message: 'Cache hit rate is below 70%'
  tags:
    - 'service:teamflow-api'
    - 'severity:info'

# Failed background jobs
- name: 'High Background Job Failure Rate'
  query: 'sum(last_1h):sum:background_jobs_failed{env:production} > 10'
  message: 'More than 10 background jobs failed in the last hour'
  tags:
    - 'service:teamflow-workers'
    - 'severity:warning'
```

### 6.6 Dashboard Design

**Key Dashboards**:

1. **Application Health Dashboard**
   - Request rate (RPM)
   - Error rate
   - Response time (p50, p95, p99)
   - Active users
   - WebSocket connections

2. **Database Dashboard**
   - Query rate
   - Query duration
   - Connection pool usage
   - Slow queries (> 1s)
   - Lock waits

3. **Cache Dashboard**
   - Hit rate
   - Miss rate
   - Eviction rate
   - Memory usage
   - Connection count

4. **Background Jobs Dashboard**
   - Queue length
   - Processing rate
   - Failed jobs
   - Job duration
   - Worker utilization

5. **Business Metrics Dashboard**
   - Active workspaces
   - Tasks created per day
   - AI requests per hour
   - User signups per day
   - Feature usage

---

## 7. Deployment Architecture

### 7.1 Environment Setup

| Environment     | Purpose                | Infrastructure   | Database           | URL                  |
| --------------- | ---------------------- | ---------------- | ------------------ | -------------------- |
| **Development** | Local development      | Docker Compose   | Local PostgreSQL   | localhost            |
| **Staging**     | Pre-production testing | Railway          | Managed PostgreSQL | staging.teamflow.app |
| **Production**  | Live application       | Railway + Vercel | Managed PostgreSQL | teamflow.app         |

### 7.2 Infrastructure

#### Frontend (Vercel)

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "regions": ["iad1", "sfo1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.teamflow.app",
    "NEXT_PUBLIC_WS_URL": "wss://api.teamflow.app"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### Backend (Railway)

```yaml
# railway.yml
services:
  api:
    build:
      dockerfile: Dockerfile
    env:
      - NODE_ENV=production
      - PORT=3000
    healthcheck:
      path: /health
      interval: 30s
      timeout: 10s
      retries: 3
    resources:
      memory: 2GB
      cpu: 2
    replicas: 3

  websocket:
    build:
      dockerfile: Dockerfile.ws
    env:
      - NODE_ENV=production
      - PORT=3001
    resources:
      memory: 1GB
      cpu: 1
    replicas: 2

  worker:
    build:
      dockerfile: Dockerfile.worker
    env:
      - NODE_ENV=production
    resources:
      memory: 1GB
      cpu: 1
    replicas: 2
```

#### Docker Configuration

**API Dockerfile**:

```dockerfile
# Multi-stage build for API
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 7.3 CI/CD Pipeline

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm type-check

      - name: Run tests
        run: pnpm test:ci
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway (Staging)
        run: railway up --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Run database migrations
        run: railway run --environment staging pnpm prisma migrate deploy

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: staging

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway (Production)
        run: railway up --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Run database migrations
        run: railway run --environment production pnpm prisma migrate deploy

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Notify Sentry of release
        run: |
          curl -sL https://sentry.io/get-cli/ | bash
          sentry-cli releases new ${{ github.sha }}
          sentry-cli releases set-commits ${{ github.sha }} --auto
          sentry-cli releases finalize ${{ github.sha }}
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

### 7.4 Deployment Strategy

#### Blue-Green Deployment

1. **Deploy Green**: Deploy new version to "green" environment
2. **Health Check**: Verify green environment is healthy
3. **Switch Traffic**: Route traffic from blue to green
4. **Monitor**: Monitor green for errors/performance issues
5. **Rollback**: If issues detected, switch back to blue
6. **Cleanup**: After stable period, update blue to new version

```yaml
# Railway deployment
services:
  api-blue:
    image: teamflow-api:v1.0.0
    active: true

  api-green:
    image: teamflow-api:v1.1.0
    active: false

# Switch traffic
$ railway service update api --active-version green

# Rollback if needed
$ railway service update api --active-version blue
```

### 7.5 Rollback Plan

#### Automated Rollback Triggers

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([checkDatabase(), checkRedis(), checkS3()]);

  const healthy = checks.every((c) => c.status === 'fulfilled');

  if (healthy) {
    res.status(200).json({ status: 'healthy', checks });
  } else {
    res.status(503).json({ status: 'unhealthy', checks });
  }
});

// Automatic rollback if health check fails for 3 consecutive minutes
```

#### Manual Rollback

```bash
# Rollback API to previous version
$ railway service rollback api --version v1.0.0

# Rollback database migrations
$ pnpm prisma migrate resolve --rolled-back <migration-name>

# Rollback frontend
$ vercel rollback teamflow-app --url <previous-deployment-url>
```

#### Database Migration Rollback

```sql
-- Every migration includes down migration
-- prisma/migrations/XXX_add_column/migration.sql

-- Up
ALTER TABLE tasks ADD COLUMN new_column TEXT;

-- Down (separate file or in comments)
ALTER TABLE tasks DROP COLUMN new_column;
```

---

## 8. Architecture Decision Records

### ADR-001: Monorepo vs Multi-repo

**Status**: Accepted
**Date**: 2025-01-15
**Deciders**: Engineering Team

#### Context

Need to decide how to structure the codebase for frontend, backend, and shared code.

#### Decision

Use **Monorepo** with pnpm workspaces and Turborepo.

#### Rationale

- Easier code sharing between frontend/backend (types, constants)
- Atomic commits across multiple packages
- Simpler dependency management
- Better developer experience with single repo clone

#### Structure

```
teamflow/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Express backend
│   └── worker/       # Background workers
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared configs (ESLint, TS)
│   └── utils/        # Shared utilities
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

#### Consequences

**Positive**:

- Faster development cycle
- Type safety across boundaries
- Easier refactoring
- Single CI/CD pipeline

**Negative**:

- Larger repository size
- Potential for tight coupling
- CI/CD runs all tests even for small changes (mitigated with Turborepo cache)

#### Alternatives Considered

- **Multi-repo**: Rejected due to overhead of managing multiple repos, duplicate code, and versioning complexity

---

### ADR-002: Next.js vs Pure React

**Status**: Accepted
**Date**: 2025-01-15
**Deciders**: Frontend Team

#### Context

Need to choose frontend framework for optimal performance and SEO.

#### Decision

Use **Next.js 14** with App Router.

#### Rationale

- Server-Side Rendering (SSR) for better SEO
- Automatic code splitting and optimization
- Built-in routing with file-based structure
- Image optimization out of the box
- Edge runtime support
- ISR for static content with dynamic updates
- Strong TypeScript support

#### Consequences

**Positive**:

- Excellent performance (LCP, FCP, CLS)
- Better SEO for public marketing pages
- Reduced bundle size with automatic code splitting
- Simplified deployment on Vercel

**Negative**:

- Learning curve for App Router (new paradigm)
- More complex than pure React SPA
- Potential SSR hydration issues

#### Alternatives Considered

- **Create React App**: Rejected - deprecated, no SSR
- **Vite + React**: Good option but lacks SSR and conventions
- **Remix**: Great but smaller ecosystem, less mature

---

### ADR-003: PostgreSQL vs MongoDB

**Status**: Accepted
**Date**: 2025-01-16
**Deciders**: Backend Team

#### Context

Need to choose database for persistent storage.

#### Decision

Use **PostgreSQL 15**.

#### Rationale

- Strong ACID guarantees for critical operations (billing, etc.)
- Excellent support for relations (tasks, projects, workspaces)
- JSONB support for flexible schemas where needed
- Full-text search capabilities
- Mature ecosystem and tooling
- Better for analytics and reporting
- Strong consistency model

#### Data Model Fit

TeamFlow has highly relational data:

- Users belong to workspaces
- Workspaces contain projects
- Projects contain tasks
- Tasks have assignees, labels, comments

PostgreSQL excels at these relationships.

#### Consequences

**Positive**:

- Data integrity guaranteed
- Complex queries with JOINs
- Transactions for multi-step operations
- Excellent Prisma ORM support

**Negative**:

- Less flexible schema changes (requires migrations)
- Vertical scaling limits (mitigated with read replicas)
- More complex setup than MongoDB

#### Alternatives Considered

- **MongoDB**: Rejected - eventual consistency issues, poor joins, no transactions until recently
- **MySQL**: Good option but PostgreSQL has better JSON support and full-text search
- **Supabase (PostgreSQL + BaaS)**: Considered for future, not for MVP

---

### ADR-004: Socket.io vs Native WebSocket

**Status**: Accepted
**Date**: 2025-01-17
**Deciders**: Backend Team

#### Context

Need to implement real-time communication for task updates, presence, etc.

#### Decision

Use **Socket.io 4**.

#### Rationale

- Automatic reconnection with exponential backoff
- Fallback to long-polling for restrictive networks
- Built-in room/namespace support
- Acknowledgment and events system
- Redis adapter for horizontal scaling
- Extensive documentation and community

#### Consequences

**Positive**:

- Production-ready with battle-tested reliability
- Easy room-based broadcasting (project:{id}, workspace:{id})
- Automatic handling of connection issues
- Simple API on both client and server

**Negative**:

- Slightly larger bundle size than native WebSocket
- Additional dependency
- Vendor lock-in to Socket.io protocol

#### Alternatives Considered

- **Native WebSocket**: Rejected - need to implement reconnection, rooms, fallback manually
- **Server-Sent Events (SSE)**: One-way only, not suitable for bi-directional communication
- **WebRTC**: Overkill for our use case, P2P not needed

---

### ADR-005: OpenAI vs Anthropic Claude

**Status**: Accepted
**Date**: 2025-01-18
**Deciders**: Product & Engineering Teams

#### Context

Need to choose AI provider for task breakdown, sprint planning, and other AI features.

#### Decision

Use **OpenAI GPT-4** as primary, **Anthropic Claude** as fallback.

#### Rationale

**OpenAI**:

- Larger context window (128k tokens)
- JSON mode for structured outputs
- More established API
- Better documentation
- Lower cost per token

**Anthropic**:

- Better instruction following
- More safety-focused
- Good for complex reasoning
- Excellent for long documents

#### Consequences

**Positive**:

- Best-in-class AI capabilities
- Redundancy with fallback provider
- Competitive pricing

**Negative**:

- External dependency (API can go down)
- Cost scales with usage
- Rate limits on free tier

#### Cost Management

- Response caching (1 hour TTL)
- Rate limiting (20 requests/hour per workspace)
- Monthly budget caps per workspace
- Use GPT-3.5-turbo for simpler tasks

#### Alternatives Considered

- **Self-hosted LLMs (Llama 2, Mistral)**: Rejected - infrastructure complexity, lower quality
- **Anthropic only**: Rejected - OpenAI has better JSON mode and lower cost
- **Google PaLM**: Less mature API, limited availability

---

### ADR-006: Vercel vs AWS

**Status**: Accepted
**Date**: 2025-01-20
**Deciders**: DevOps & Engineering Teams

#### Context

Need to choose deployment platform for frontend and infrastructure for backend.

#### Decision

Use **Vercel** for frontend, **Railway** for backend.

#### Rationale

**Vercel for Frontend**:

- Purpose-built for Next.js
- Global edge network (100+ locations)
- Zero-config deployments
- Automatic HTTPS and SSL
- Preview deployments for PRs
- Excellent DX

**Railway for Backend**:

- Simple PostgreSQL provisioning
- Easy Redis setup
- Docker support
- Automatic scaling
- Good free tier for MVP
- Simple pricing

#### Consequences

**Positive**:

- Fastest time to market
- Minimal DevOps overhead
- Automatic scaling
- Great developer experience

**Negative**:

- Vendor lock-in
- Cost increases with scale (plan migration to AWS later)
- Less control over infrastructure

#### Migration Plan (Post-MVP)

When reaching scale limits or cost concerns:

1. Backend → AWS ECS/EKS
2. Database → AWS RDS
3. Cache → AWS ElastiCache
4. Frontend stays on Vercel (excellent value)

#### Alternatives Considered

- **AWS**: Full control but significant DevOps overhead, slower MVP
- **GCP**: Good but less Next.js integration than Vercel
- **DigitalOcean**: Simple but lacks advanced features
- **Fly.io**: Good for backend but no managed PostgreSQL

---

## Summary

This system architecture is designed for:

- **MVP Launch**: Fast development with managed services
- **Scale**: Horizontal scaling to 10,000+ concurrent users
- **Reliability**: 99.9% uptime target
- **Performance**: Sub-second API responses, real-time updates
- **Security**: Enterprise-grade security practices
- **Observability**: Comprehensive monitoring and alerting

### Technology Stack Summary

| Layer          | Technology                        | Rationale                         |
| -------------- | --------------------------------- | --------------------------------- |
| **Frontend**   | Next.js 14, React 18, TypeScript  | SSR, SEO, performance             |
| **API**        | Node.js 20, Express 4, TypeScript | Familiar, fast, mature            |
| **Database**   | PostgreSQL 15                     | ACID, relations, full-text search |
| **ORM**        | Prisma 5                          | Type-safe, migrations, great DX   |
| **Cache**      | Redis 7 Cluster                   | Fast, pub/sub, sessions           |
| **WebSocket**  | Socket.io 4                       | Rooms, reconnection, fallback     |
| **Jobs**       | BullMQ                            | Redis-based, reliable, UI         |
| **AI**         | OpenAI GPT-4 + Anthropic Claude   | Best quality, fallback            |
| **Storage**    | S3 / Cloudflare R2                | Scalable, cheap, CDN              |
| **Monitoring** | DataDog, Sentry, LogFlare         | APM, errors, logs                 |
| **Deployment** | Vercel (FE), Railway (BE)         | Fast, managed, scalable           |

### Next Steps

1. **Week 1-2**: Set up infrastructure and CI/CD
2. **Week 3-4**: Implement authentication and core API
3. **Week 5-6**: Build task management frontend
4. **Week 7-8**: Add real-time features and WebSocket
5. **Week 9-10**: Implement AI features
6. **Week 11-12**: Testing, monitoring, and launch

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Status**: Ready for Implementation
**Review Date**: 2025-04-22 (3 months)
