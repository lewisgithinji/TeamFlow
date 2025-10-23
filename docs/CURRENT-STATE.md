# TeamFlow - Current Project State

**Last Updated:** 2025-10-03
**Status:** Development - Sprint 2 In Progress

## 🎯 What's Working Now

### ✅ Infrastructure

- PostgreSQL database running (localhost:5432)
- Redis cache running (localhost:6379)
- Backend API running (http://localhost:4000)
- Frontend web app running (http://localhost:3001)
- Structured logging with Winston is implemented.
- Prisma ORM configured with full schema

### ✅ Authentication System

**Location:** `apps/api/src/modules/auth/`

**Files:**

- `auth.service.ts` - Business logic (functional approach)
- `auth.controller.ts` - Request handlers
- `auth.routes.ts` - Route definitions with middleware
- `auth.types.ts` - Zod validation schemas + TypeScript types

**Endpoints Working:**

- `POST /api/auth/register` - User registration
  - Returns 201 with user + JWT tokens
  - Validates: name (min 2), email, password (min 8, uppercase, lowercase, number)
  - Hashes passwords with bcrypt
  - Returns 409 for duplicate email
  - Returns 400 for validation errors

- `POST /api/auth/login` - User authentication
  - Returns 200 with user + JWT tokens
  - Account lockout after 5 failed attempts (15 min)
  - Updates lastLoginAt timestamp

- `GET /api/auth/me` - Get current user (PROTECTED)
  - Requires JWT token in Authorization header
  - Returns user profile (no password)

**Middleware:**

- `middleware/auth.ts` - JWT authentication middleware
- `middleware/validate.ts` - Zod validation middleware

**Utilities:**

- `utils/jwt.ts` - Token generation/verification
- `utils/hash.ts` - Password hashing with bcrypt

### ✅ Task Management System

**Location:** `apps/api/src/modules/task/`

**Endpoints Working:**

- `GET /api/tasks/project/:projectId` - Get all tasks for a project
- `GET /api/tasks/:taskId` - Get a single task
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:taskId` - Update a task
- `DELETE /api/tasks/:taskId` - Delete a task

**Authorization:**

- All endpoints are protected and require authentication.
- **Workspace Membership**: Users can only access tasks within workspaces they are members of.
- **Role-Based Access Control (RBAC)**: Deleting tasks is restricted to `OWNER` and `ADMIN` roles.
- **Ownership-Based Access**: The original creator of a task is also allowed to delete it.

### ✅ Real-time Backend

**Location:** `apps/api/src/websocket/`

- WebSocket server is fully implemented with Socket.io and a Redis adapter for scaling.
- JWT-based authentication for secure connections.
- Room-based architecture is in place for broadcasting events.

### ✅ Database Schema

**Location:** `packages/database/prisma/schema.prisma`

**Models Implemented:**

- User (with OAuth support, email verification fields)
- Workspace (with owner relation)
- WorkspaceMember (join table with roles)
- Project (with visibility, kanban columns)
- Task (full agile fields: status, priority, story points, etc.)
- Sprint
- Label
- Comment
- TaskAssignee
- Activity
- Integration

**Seeded Data:**

- Demo user: `demo@teamflow.dev` / `password123`
- Demo workspace: "Demo Workspace"
- Demo project: "Demo Project"
- 3 demo tasks with labels

### ✅ Frontend Pages

**Location:** `apps/web/src/app/`

- `(auth)/login/page.tsx` - Login form (working)
- `(auth)/register/page.tsx` - Registration form (working)
- `(auth)/forgot-password/page.tsx` - Password reset form (UI only)
- `(dashboard)/dashboard/page.tsx` - Basic dashboard (working)

---

## 🚧 What's NOT Implemented Yet

### ❌ Email Functionality

- No email service configured (need Resend/SendGrid)
- Email verification not implemented
- Password reset emails not sent
- Welcome emails not sent
- OAuth (Google/GitHub) integration
- Refresh token endpoint
- Logout endpoint

### ❌ Workspace Features

- Workspace switching
- Workspace settings
- Member invitations

### ❌ Task Management

- Task CRUD endpoints
- Kanban board UI integration with backend
- Drag-and-drop functionality
- Real-time UI updates for tasks and comments
- User presence and typing indicators on the frontend

---

## 📂 Important File Locations

### Backend API

```
apps/api/src/
├── modules/
│   └── auth/           ← Authentication module
├── middleware/
│   ├── auth.ts        ← JWT middleware
│   └── validate.ts    ← Zod validation
├── utils/
│   ├── jwt.ts         ← Token utilities
│   └── hash.ts        ← Password hashing
└── index.ts           ← Express app entry
```

### Frontend Web

```
apps/web/src/app/
├── (auth)/
│   ├── login/         ← Login page
│   ├── register/      ← Registration page
│   └── forgot-password/ ← Password reset
├── (dashboard)/
│   └── dashboard/     ← Main dashboard
├── layout.tsx         ← Root layout
└── globals.css        ← Global styles
```

### Database

```
packages/database/
├── prisma/
│   ├── schema.prisma  ← Data models
│   └── seed.ts        ← Seed script
└── .env               ← Database connection
```

---

## 🔑 Key Decisions Made

### Architecture

- **Pattern:** Functional programming (not classes)
- **Validation:** Zod schemas in route middleware
- **Error Handling:** Custom error responses in controllers
- **Auth:** JWT with access + refresh tokens (15m / 7d expiry)

### Tech Stack Confirmed

- **Backend:** Express.js with TypeScript
- **Frontend:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** TailwindCSS
- **Validation:** Zod
- **Monorepo:** Turborepo + pnpm workspaces

### Security Implemented

- ✅ Password hashing (bcrypt, cost 10)
- ✅ JWT tokens with secret from env
- ✅ Account lockout (5 attempts, 15 min)
- ✅ Input validation with Zod
- ✅ CORS configured
- ❌ Rate limiting (not yet)
- ❌ CSRF protection (not yet)

---

## 🐛 Known Issues

1. **Dashboard requires authentication but doesn't redirect on 401**
   - Status: Minor, not blocking
   - Workaround: Clear localStorage and re-login

2. **Port 3000 conflict - Frontend runs on 3001**
   - Status: Expected, another app using 3000
   - Resolution: Use 3001 or stop other app

---

## 🎯 Next Features to Build (Priority Order)

1. **Email Verification** (High Priority)
   - Setup Resend/SendGrid
   - Send verification email on registration
   - Create verification endpoint
   - Update UI to show "verify email" message

2. **Password Reset** (High Priority)
   - Generate reset tokens
   - Send reset emails
   - Create reset password endpoint
   - Reset password form UI

3. **Workspace Management** (Medium Priority)
   - Create workspace endpoint
   - List user workspaces
   - Workspace switcher UI
   - Invite members to workspace

4. **Task Management** (Medium Priority)
   - Task CRUD endpoints
   - Kanban board UI
   - Drag-and-drop
   - Task details modal

---

## 📖 How to Use This Document

**When building new features:**

1. Check "What's NOT Implemented Yet" to see what needs building
2. Check "Important File Locations" to know where to add code
3. Check "Key Decisions Made" to follow existing patterns
4. Update this doc when you complete features

**When Claude Code hallucinates:**
Point to this document and say:
"Based on CURRENT-STATE.md, implement [feature] following existing patterns"

---

## 🔄 Document Update Protocol

**Update this doc when:**

- ✅ Complete a major feature
- ✅ Make architecture decisions
- ✅ Add new endpoints
- ✅ Discover bugs
- ❌ Daily (too frequent)
- ❌ For tiny changes (just commit those)

**How to update:**

```bash
# After completing email verification:
# 1. Move from "Not Implemented" to "What's Working"
# 2. Update file locations if new files added
# 3. Add any new decisions to "Key Decisions"
# 4. Commit with message: "docs: update current state - email verification complete"
```
