# TeamFlow Directory Structure

**Version**: 1.0
**Last Updated**: 2025-01-22
**Status**: Approved for Implementation

This document defines the complete directory structure for the TeamFlow monorepo using Turborepo + pnpm workspaces.

## Table of Contents

1. [Repository Type Decision](#repository-type-decision)
2. [Root Structure](#root-structure)
3. [Apps Structure](#apps-structure)
4. [Packages Structure](#packages-structure)
5. [File Naming Conventions](#file-naming-conventions)
6. [Import Paths](#import-paths)
7. [Configuration Files](#configuration-files)

---

## Repository Type Decision

**Decision**: **Monorepo with Turborepo**

**Rationale**:

1. **Shared Code**: Frontend and backend share types, validators, and utilities
2. **Atomic Changes**: Single PR can update API contract + frontend in sync
3. **Simplified Dependencies**: Single `pnpm install` for entire project
4. **Build Coordination**: Turborepo orchestrates builds across packages
5. **Type Safety**: Shared TypeScript types prevent API contract drift
6. **Developer Experience**: One repo to clone, one IDE workspace

**Alternatives Rejected**:

- ❌ **Separate Repos**: Would duplicate types, complicate API versioning, slower development
- ❌ **Multi-repo**: More CI complexity, harder to coordinate changes

---

## Root Structure

```
teamflow/
├── apps/                           # Applications (deployable)
│   ├── web/                        # Next.js frontend
│   └── api/                        # Express backend
├── packages/                       # Shared packages
│   ├── ui/                         # Shared UI components (shadcn/ui)
│   ├── database/                   # Prisma schema & client
│   ├── typescript-config/          # Shared TypeScript configs
│   ├── eslint-config/              # Shared ESLint configs
│   ├── validators/                 # Shared Zod schemas
│   ├── types/                      # Shared TypeScript types
│   └── utils/                      # Shared utility functions
├── docs/                           # All documentation
│   ├── brainstorm/                 # PRD, requirements
│   ├── model/                      # Data models, flows, APIs
│   ├── architecture/               # System design, tech stack
│   └── guides/                     # Development guides
├── scripts/                        # Build & deployment scripts
│   ├── setup.sh                    # Project setup script
│   ├── db-migrate.sh               # Database migration helper
│   └── deploy.sh                   # Deployment script
├── infrastructure/                 # Docker, K8s, etc.
│   ├── docker-compose.yml          # Local development
│   ├── Dockerfile.api              # Backend Docker image
│   └── Dockerfile.web              # Frontend Docker image (if needed)
├── .github/                        # GitHub-specific files
│   ├── workflows/                  # GitHub Actions CI/CD
│   │   ├── ci.yml                  # Run tests on PR
│   │   ├── deploy-api.yml          # Deploy backend to Railway
│   │   └── deploy-web.yml          # Deploy frontend to Vercel
│   └── PULL_REQUEST_TEMPLATE.md    # PR template
├── .husky/                         # Git hooks
│   ├── pre-commit                  # Run lint-staged
│   └── commit-msg                  # Validate commit message
├── .vscode/                        # VS Code workspace settings
│   ├── settings.json               # Workspace settings
│   ├── extensions.json             # Recommended extensions
│   └── launch.json                 # Debug configurations
├── turbo.json                      # Turborepo configuration
├── pnpm-workspace.yaml             # pnpm workspace configuration
├── package.json                    # Root package.json
├── pnpm-lock.yaml                  # Lock file
├── .env.example                    # Example environment variables
├── .gitignore                      # Git ignore rules
├── .prettierrc.json                # Prettier configuration
├── .prettierignore                 # Prettier ignore rules
├── README.md                       # Main README
└── LICENSE                         # MIT License
```

---

## Apps Structure

### apps/web/ (Next.js Frontend)

```
apps/web/
├── public/                         # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── hero-bg.jpg
│       └── avatar-placeholder.png
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth route group (shared layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # /login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx        # /register page
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx        # /forgot-password page
│   │   │   └── layout.tsx          # Auth layout (centered card)
│   │   ├── (dashboard)/            # Dashboard route group (app layout)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # /dashboard page
│   │   │   ├── workspaces/
│   │   │   │   ├── page.tsx        # /workspaces (list)
│   │   │   │   ├── [workspaceId]/
│   │   │   │   │   ├── page.tsx    # /workspaces/:id (overview)
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── page.tsx # /workspaces/:id/projects
│   │   │   │   │   │   └── [projectId]/
│   │   │   │   │   │       ├── page.tsx # /workspaces/:id/projects/:id
│   │   │   │   │   │       ├── board/
│   │   │   │   │   │       │   └── page.tsx # Kanban board
│   │   │   │   │   │       ├── list/
│   │   │   │   │   │       │   └── page.tsx # List view
│   │   │   │   │   │       ├── calendar/
│   │   │   │   │   │       │   └── page.tsx # Calendar view
│   │   │   │   │   │       └── settings/
│   │   │   │   │   │           └── page.tsx # Project settings
│   │   │   │   │   ├── sprints/
│   │   │   │   │   │   ├── page.tsx # /workspaces/:id/sprints
│   │   │   │   │   │   └── [sprintId]/
│   │   │   │   │   │       └── page.tsx # Sprint detail
│   │   │   │   │   ├── team/
│   │   │   │   │   │   └── page.tsx # Team members
│   │   │   │   │   ├── integrations/
│   │   │   │   │   │   └── page.tsx # Integrations
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx # Workspace settings
│   │   │   │   └── new/
│   │   │   │       └── page.tsx    # Create workspace
│   │   │   ├── tasks/
│   │   │   │   └── [taskId]/
│   │   │   │       └── page.tsx    # Task detail (modal route)
│   │   │   ├── profile/
│   │   │   │   └── page.tsx        # User profile
│   │   │   ├── settings/
│   │   │   │   └── page.tsx        # User settings
│   │   │   └── layout.tsx          # Dashboard layout (sidebar, header)
│   │   ├── (marketing)/            # Marketing route group (public)
│   │   │   ├── page.tsx            # Homepage (/)
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx        # /pricing
│   │   │   ├── about/
│   │   │   │   └── page.tsx        # /about
│   │   │   └── layout.tsx          # Marketing layout (header, footer)
│   │   ├── api/                    # API routes (for OAuth callbacks)
│   │   │   ├── auth/
│   │   │   │   ├── callback/
│   │   │   │   │   └── route.ts    # OAuth callback handler
│   │   │   │   └── refresh/
│   │   │   │       └── route.ts    # Token refresh endpoint
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts    # Stripe webhook handler
│   │   ├── layout.tsx              # Root layout (providers, fonts)
│   │   ├── error.tsx               # Global error boundary
│   │   ├── not-found.tsx           # 404 page
│   │   └── loading.tsx             # Global loading state
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui components (from @teamflow/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...                 # 30+ components
│   │   ├── auth/                   # Auth-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── OAuthButtons.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── board/                  # Kanban board components
│   │   │   ├── Board.tsx           # Main board container
│   │   │   ├── Column.tsx          # Board column
│   │   │   ├── TaskCard.tsx        # Draggable task card
│   │   │   ├── AddTaskButton.tsx
│   │   │   └── BoardFilters.tsx
│   │   ├── task/                   # Task components
│   │   │   ├── TaskDetail.tsx      # Task detail modal
│   │   │   ├── TaskForm.tsx        # Create/edit task
│   │   │   ├── TaskList.tsx        # List view
│   │   │   ├── TaskComments.tsx
│   │   │   ├── TaskSubtasks.tsx
│   │   │   ├── TaskAttachments.tsx
│   │   │   ├── TaskActivity.tsx
│   │   │   └── TaskAssignees.tsx
│   │   ├── sprint/                 # Sprint components
│   │   │   ├── SprintBoard.tsx
│   │   │   ├── SprintForm.tsx
│   │   │   ├── SprintVelocityChart.tsx
│   │   │   └── SprintBurndownChart.tsx
│   │   ├── workspace/              # Workspace components
│   │   │   ├── WorkspaceCard.tsx
│   │   │   ├── WorkspaceForm.tsx
│   │   │   ├── WorkspaceSwitcher.tsx
│   │   │   └── WorkspaceSettings.tsx
│   │   ├── team/                   # Team components
│   │   │   ├── TeamMemberList.tsx
│   │   │   ├── InviteMemberForm.tsx
│   │   │   ├── MemberRoleSelect.tsx
│   │   │   └── UserAvatar.tsx
│   │   ├── integration/            # Integration components
│   │   │   ├── IntegrationCard.tsx
│   │   │   ├── SlackConnect.tsx
│   │   │   ├── GitHubConnect.tsx
│   │   │   └── GoogleCalendarConnect.tsx
│   │   ├── ai/                     # AI-specific components
│   │   │   ├── AITaskBreakdown.tsx
│   │   │   ├── AISprintPlanning.tsx
│   │   │   └── AILoadingState.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── marketing/              # Marketing components
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── PricingTable.tsx
│   │   │   └── CTA.tsx
│   │   └── shared/                 # Shared/common components
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── FileUpload.tsx
│   │       ├── MarkdownEditor.tsx
│   │       ├── DatePicker.tsx
│   │       └── SearchInput.tsx
│   ├── lib/                        # Utility functions
│   │   ├── api-client.ts           # API client (fetch wrapper)
│   │   ├── socket.ts               # Socket.io client setup
│   │   ├── auth.ts                 # Auth utilities
│   │   ├── utils.ts                # General utilities (cn, etc.)
│   │   ├── date.ts                 # Date formatting (date-fns)
│   │   ├── file.ts                 # File upload utilities
│   │   └── constants.ts            # App constants
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Auth hook
│   │   ├── useSocket.ts            # Socket.io hook
│   │   ├── useWorkspace.ts         # Current workspace hook
│   │   ├── useProject.ts           # Current project hook
│   │   ├── useDebounce.ts          # Debounce hook
│   │   ├── useMediaQuery.ts        # Responsive hook
│   │   ├── useLocalStorage.ts      # LocalStorage hook
│   │   └── useOnClickOutside.ts    # Click outside hook
│   ├── store/                      # Zustand stores
│   │   ├── authStore.ts            # Auth state (user, tokens)
│   │   ├── boardStore.ts           # Board state (tasks, filters)
│   │   ├── workspaceStore.ts       # Current workspace
│   │   ├── uiStore.ts              # UI state (sidebar, modals)
│   │   └── presenceStore.ts        # Real-time presence
│   ├── queries/                    # TanStack Query hooks
│   │   ├── useTaskQueries.ts       # Task queries & mutations
│   │   ├── useProjectQueries.ts    # Project queries
│   │   ├── useSprintQueries.ts     # Sprint queries
│   │   ├── useWorkspaceQueries.ts  # Workspace queries
│   │   ├── useUserQueries.ts       # User queries
│   │   └── queryClient.ts          # Query client config
│   ├── styles/                     # Global styles
│   │   └── globals.css             # Tailwind + custom CSS
│   └── types/                      # Frontend-specific types
│       ├── api.ts                  # API response types
│       ├── socket.ts               # Socket event types
│       └── local.ts                # Local-only types
├── .env.local                      # Local environment variables
├── .env.example                    # Example env vars
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── postcss.config.js               # PostCSS configuration
├── components.json                 # shadcn/ui configuration
├── package.json                    # Package dependencies
└── README.md                       # Web app README
```

---

### apps/api/ (Express Backend)

```
apps/api/
├── src/
│   ├── index.ts                    # Entry point (server start)
│   ├── app.ts                      # Express app setup (middleware, routes)
│   ├── config/                     # Configuration
│   │   ├── env.ts                  # Environment variables (validated with Zod)
│   │   ├── database.ts             # Database connection
│   │   ├── redis.ts                # Redis connection
│   │   ├── jwt.ts                  # JWT configuration
│   │   ├── ai.ts                   # OpenAI/Anthropic config
│   │   ├── email.ts                # Resend config
│   │   ├── storage.ts              # Cloudflare R2 config
│   │   └── integrations.ts         # Third-party API configs
│   ├── routes/                     # API routes (Express routers)
│   │   ├── index.ts                # Combine all routes
│   │   ├── auth.routes.ts          # /api/auth/*
│   │   ├── users.routes.ts         # /api/users/*
│   │   ├── workspaces.routes.ts    # /api/workspaces/*
│   │   ├── projects.routes.ts      # /api/projects/*
│   │   ├── tasks.routes.ts         # /api/tasks/*
│   │   ├── sprints.routes.ts       # /api/sprints/*
│   │   ├── comments.routes.ts      # /api/comments/*
│   │   ├── labels.routes.ts        # /api/labels/*
│   │   ├── integrations.routes.ts  # /api/integrations/*
│   │   ├── webhooks.routes.ts      # /api/webhooks/*
│   │   ├── ai.routes.ts            # /api/ai/*
│   │   └── health.routes.ts        # /api/health (health check)
│   ├── controllers/                # Route handlers (business logic)
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── workspaces.controller.ts
│   │   ├── projects.controller.ts
│   │   ├── tasks.controller.ts
│   │   ├── sprints.controller.ts
│   │   ├── comments.controller.ts
│   │   ├── labels.controller.ts
│   │   ├── integrations.controller.ts
│   │   ├── webhooks.controller.ts
│   │   └── ai.controller.ts
│   ├── services/                   # Business logic services
│   │   ├── auth.service.ts         # Auth logic (register, login, refresh)
│   │   ├── user.service.ts         # User CRUD
│   │   ├── workspace.service.ts    # Workspace CRUD + permissions
│   │   ├── project.service.ts      # Project CRUD
│   │   ├── task.service.ts         # Task CRUD + version control
│   │   ├── sprint.service.ts       # Sprint CRUD + planning
│   │   ├── comment.service.ts      # Comment CRUD
│   │   ├── label.service.ts        # Label CRUD
│   │   ├── activity.service.ts     # Activity log service
│   │   ├── notification.service.ts # Notification service
│   │   ├── ai.service.ts           # AI service (OpenAI/Anthropic)
│   │   ├── email.service.ts        # Email service (Resend)
│   │   ├── storage.service.ts      # File storage (R2)
│   │   ├── cache.service.ts        # Redis caching
│   │   └── integration/            # Integration services
│   │       ├── slack.service.ts
│   │       ├── github.service.ts
│   │       └── google-calendar.service.ts
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── permission.middleware.ts # RBAC authorization
│   │   ├── validation.middleware.ts # Zod validation
│   │   ├── error.middleware.ts     # Error handler
│   │   ├── rateLimit.middleware.ts # Rate limiting (Redis)
│   │   ├── cors.middleware.ts      # CORS configuration
│   │   ├── logger.middleware.ts    # Request logging (Better Stack)
│   │   └── sentry.middleware.ts    # Sentry error tracking
│   ├── websocket/                  # Socket.io setup
│   │   ├── index.ts                # Socket.io server initialization
│   │   ├── handlers/               # Socket event handlers
│   │   │   ├── task.handler.ts     # Task events (TASK_UPDATED, etc.)
│   │   │   ├── sprint.handler.ts   # Sprint events
│   │   │   ├── presence.handler.ts # Presence events (USER_JOINED, etc.)
│   │   │   └── comment.handler.ts  # Comment events
│   │   └── middleware/             # Socket middleware
│   │       ├── auth.middleware.ts  # Socket auth
│   │       └── room.middleware.ts  # Room management
│   ├── jobs/                       # Background jobs (BullMQ)
│   │   ├── index.ts                # Job queue setup
│   │   ├── workers/                # Job workers
│   │   │   ├── email.worker.ts     # Send emails
│   │   │   ├── notification.worker.ts # Send notifications
│   │   │   ├── ai.worker.ts        # AI processing (task breakdown)
│   │   │   └── cleanup.worker.ts   # Cleanup old data
│   │   └── processors/             # Job processors
│   │       ├── email.processor.ts
│   │       ├── notification.processor.ts
│   │       ├── ai.processor.ts
│   │       └── cleanup.processor.ts
│   ├── utils/                      # Utility functions
│   │   ├── logger.ts               # Winston logger
│   │   ├── crypto.ts               # Encryption utilities
│   │   ├── jwt.ts                  # JWT utilities
│   │   ├── errors.ts               # Custom error classes
│   │   ├── validators.ts           # Custom validators
│   │   └── helpers.ts              # General helpers
│   └── types/                      # Backend-specific types
│       ├── express.d.ts            # Extend Express types
│       ├── socket.d.ts             # Socket.io types
│       └── jobs.ts                 # Job types
├── tests/                          # Tests
│   ├── unit/                       # Unit tests (services)
│   │   ├── auth.service.test.ts
│   │   ├── task.service.test.ts
│   │   └── ...
│   ├── integration/                # Integration tests (API routes)
│   │   ├── auth.routes.test.ts
│   │   ├── tasks.routes.test.ts
│   │   └── ...
│   ├── e2e/                        # End-to-end tests
│   │   └── task-workflow.test.ts
│   ├── fixtures/                   # Test fixtures (sample data)
│   │   ├── users.ts
│   │   ├── workspaces.ts
│   │   └── tasks.ts
│   └── setup.ts                    # Test setup (DB, mocks)
├── .env                            # Environment variables (not committed)
├── .env.example                    # Example env vars
├── tsconfig.json                   # TypeScript configuration
├── vitest.config.ts                # Vitest configuration
├── package.json                    # Package dependencies
├── Dockerfile                      # Docker image for production
└── README.md                       # API README
```

---

## Packages Structure

### packages/ui/ (Shared UI Components)

```
packages/ui/
├── src/
│   ├── components/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...                     # 30+ components
│   ├── hooks/                      # UI hooks
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   └── lib/
│       └── utils.ts                # cn() utility
├── tailwind.config.ts              # Tailwind config (base)
├── tsconfig.json                   # TypeScript config
├── package.json                    # Dependencies (React, Tailwind)
└── README.md
```

---

### packages/database/ (Prisma Client)

```
packages/database/
├── prisma/
│   ├── schema.prisma               # Prisma schema (all models)
│   ├── migrations/                 # Database migrations
│   │   ├── 20250101000000_init/
│   │   │   └── migration.sql
│   │   ├── 20250102000000_add_sprints/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── seed.ts                     # Database seed script
├── src/
│   ├── index.ts                    # Export Prisma client
│   └── client.ts                   # Prisma client instance
├── tsconfig.json
├── package.json                    # Dependencies (Prisma)
└── README.md
```

**prisma/schema.prisma** (excerpt):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String   @id @default(uuid())
  email                 String   @unique
  name                  String
  passwordHash          String?
  avatarUrl             String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  workspaceMemberships  WorkspaceMember[]
  createdTasks          Task[]   @relation("CreatedTasks")
  assignedTasks         TaskAssignee[]
  comments              Comment[]
  // ... more relations

  @@map("users")
}

// ... 16 more models (Workspace, Project, Task, Sprint, etc.)
```

---

### packages/validators/ (Zod Schemas)

```
packages/validators/
├── src/
│   ├── index.ts                    # Export all schemas
│   ├── auth.schemas.ts             # Auth validation (login, register)
│   ├── user.schemas.ts             # User validation
│   ├── workspace.schemas.ts        # Workspace validation
│   ├── project.schemas.ts          # Project validation
│   ├── task.schemas.ts             # Task validation
│   ├── sprint.schemas.ts           # Sprint validation
│   ├── comment.schemas.ts          # Comment validation
│   ├── label.schemas.ts            # Label validation
│   ├── integration.schemas.ts      # Integration validation
│   ├── common.schemas.ts           # Common schemas (pagination, etc.)
│   └── enums.ts                    # Zod enums (TaskStatus, etc.)
├── tsconfig.json
├── package.json                    # Dependencies (Zod)
└── README.md
```

**Example schema** (src/task.schemas.ts):

```typescript
import { z } from 'zod';
import { TaskStatus, TaskPriority } from './enums';

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  status: TaskStatus.default('TODO'),
  priority: TaskPriority.default('MEDIUM'),
  storyPoints: z.number().int().min(1).max(100).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  version: z.number().int(), // Optimistic locking
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
```

---

### packages/types/ (Shared TypeScript Types)

```
packages/types/
├── src/
│   ├── index.ts                    # Export all types
│   ├── models.ts                   # Database model types (from Prisma)
│   ├── api.ts                      # API request/response types
│   ├── socket.ts                   # Socket.io event types
│   ├── ai.ts                       # AI-related types
│   ├── integration.ts              # Integration types
│   └── common.ts                   # Common types (Pagination, etc.)
├── tsconfig.json
├── package.json
└── README.md
```

**Example types** (src/socket.ts):

```typescript
// Socket event types
export type SocketEvents = {
  // Task events
  TASK_CREATED: { taskId: string; task: Task };
  TASK_UPDATED: { taskId: string; changes: Partial<Task>; version: number };
  TASK_DELETED: { taskId: string };

  // Presence events
  USER_JOINED: { userId: string; userName: string; projectId: string };
  USER_LEFT: { userId: string; projectId: string };
  USER_TYPING: { userId: string; taskId: string };

  // ... more events
};

export type SocketRoom = `project:${string}` | `workspace:${string}`;
```

---

### packages/utils/ (Shared Utilities)

```
packages/utils/
├── src/
│   ├── index.ts                    # Export all utilities
│   ├── date.ts                     # Date utilities (date-fns wrappers)
│   ├── string.ts                   # String utilities (slugify, etc.)
│   ├── array.ts                    # Array utilities
│   ├── object.ts                   # Object utilities
│   ├── validation.ts               # Validation helpers
│   └── constants.ts                # Shared constants
├── tsconfig.json
├── package.json
└── README.md
```

---

### packages/typescript-config/

```
packages/typescript-config/
├── base.json                       # Base TS config
├── nextjs.json                     # Next.js TS config (extends base)
├── node.json                       # Node.js TS config (extends base)
├── package.json
└── README.md
```

**base.json**:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

---

### packages/eslint-config/

```
packages/eslint-config/
├── base.js                         # Base ESLint config
├── nextjs.js                       # Next.js ESLint (extends base)
├── node.js                         # Node.js ESLint (extends base)
├── package.json
└── README.md
```

---

## File Naming Conventions

### TypeScript Files

- **Components**: `PascalCase.tsx` (e.g., `TaskCard.tsx`, `Board.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `apiClient.ts`, `formatDate.ts`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`, `useSocket.ts`)
- **Types**: `camelCase.ts` (e.g., `api.ts`, `socket.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts` (e.g., `auth.service.test.ts`)

### React Components

- **One component per file** (except small helper components)
- **File name matches component name**
  - ✅ `TaskCard.tsx` exports `TaskCard`
  - ❌ `task-card.tsx` exports `TaskCard`

### API Routes (Express)

- **Plural nouns**: `tasks.routes.ts`, `projects.routes.ts`
- **Grouped by resource**: `/api/tasks`, `/api/projects`

### Next.js App Router

- **Folders**: `kebab-case` (e.g., `forgot-password/`, `api-docs/`)
- **Files**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

---

## Import Paths

### Internal Imports (Workspace Packages)

Use workspace aliases defined in `package.json`:

```json
{
  "dependencies": {
    "@teamflow/ui": "workspace:*",
    "@teamflow/database": "workspace:*",
    "@teamflow/validators": "workspace:*",
    "@teamflow/types": "workspace:*",
    "@teamflow/utils": "workspace:*"
  }
}
```

**Example imports**:

```typescript
// apps/web/src/app/dashboard/page.tsx
import { Button } from '@teamflow/ui/components/button';
import { createTaskSchema } from '@teamflow/validators';
import { Task } from '@teamflow/types';
import { formatDate } from '@teamflow/utils';
```

```typescript
// apps/api/src/services/task.service.ts
import { prisma } from '@teamflow/database';
import { createTaskSchema } from '@teamflow/validators';
import { Task } from '@teamflow/types';
```

### Relative Imports (Within Same App)

Use path aliases defined in `tsconfig.json`:

**apps/web/tsconfig.json**:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Example imports**:

```typescript
// apps/web/src/components/board/Board.tsx
import { TaskCard } from '@/components/board/TaskCard';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
```

**apps/api/tsconfig.json**:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Example imports**:

```typescript
// apps/api/src/controllers/task.controller.ts
import { taskService } from '@/services/task.service';
import { authenticate } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';
```

---

## Configuration Files

### Root Configuration Files

#### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

#### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### Root package.json

```json
{
  "name": "teamflow",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "prepare": "husky install",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed",
    "db:studio": "cd packages/database && pnpm prisma studio"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "eslint": "^9.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@8.14.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

#### .prettierrc.json

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### .prettierignore

```
node_modules
.next
dist
coverage
*.lock
pnpm-lock.yaml
.turbo
*.log
```

#### .gitignore

```
# Dependencies
node_modules
.pnpm-store

# Build outputs
.next
dist
out
build

# Turbo
.turbo

# Environment variables
.env
.env*.local

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea

# Testing
coverage
*.tsbuildinfo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Prisma
*.db
*.db-journal
```

---

## VS Code Workspace Settings

**.vscode/settings.json**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.next": true,
    "**/dist": true,
    "**/node_modules": true,
    "**/.turbo": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/pnpm-lock.yaml": true
  }
}
```

**.vscode/extensions.json**:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "usernamehw.errorlens"
  ]
}
```

**.vscode/launch.json** (Debug configurations):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm --filter @teamflow/web dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "API: debug server",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm --filter @teamflow/api dev"
    }
  ]
}
```

---

## Docker Configuration

**infrastructure/docker-compose.yml** (Local development):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: teamflow-postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: teamflow
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: teamflow_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U teamflow']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: teamflow-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

---

## Summary

### Key Structural Decisions

1. **Monorepo Architecture**: Turborepo + pnpm workspaces for shared code, atomic changes, and simplified dependencies

2. **Shared Packages**:
   - `@teamflow/ui`: shadcn/ui components (shared UI)
   - `@teamflow/database`: Prisma client (single source of truth for DB schema)
   - `@teamflow/validators`: Zod schemas (shared validation frontend + backend)
   - `@teamflow/types`: TypeScript types (shared types)
   - `@teamflow/utils`: Utility functions (shared utilities)
   - `@teamflow/typescript-config`: TS configs (DRY)
   - `@teamflow/eslint-config`: ESLint configs (DRY)

3. **Frontend Structure** (Next.js):
   - App Router with route groups: `(auth)`, `(dashboard)`, `(marketing)`
   - Organized by feature: `components/board/`, `components/task/`, etc.
   - Zustand stores + TanStack Query hooks for state management
   - Path aliases (`@/*`) for clean imports

4. **Backend Structure** (Express):
   - Layered architecture: Routes → Controllers → Services
   - Middleware for cross-cutting concerns (auth, validation, errors)
   - Socket.io handlers for real-time events
   - BullMQ jobs for background processing
   - Path aliases (`@/*`) for clean imports

5. **Configuration**:
   - Turborepo for build orchestration
   - pnpm for fast, efficient package management
   - Shared configs (TypeScript, ESLint, Prettier)
   - Docker Compose for local development

---

**Next Steps**:

1. Initialize repository with this structure
2. Set up pnpm workspaces and Turborepo
3. Configure shared packages (`ui`, `database`, `validators`, etc.)
4. Set up development environment (Docker, VS Code)
5. Begin implementation: Authentication → Core features → AI features

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Review Date**: 2025-04-22 (3 months)
**Status**: Approved for Implementation
