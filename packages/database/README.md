# @teamflow/database

Prisma database client and schema for TeamFlow.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Generate Prisma client:
```bash
pnpm db:generate
```

3. Run migrations:
```bash
pnpm db:migrate
```

4. Seed the database:
```bash
pnpm db:seed
```

## Scripts

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio (GUI)
- `pnpm db:seed` - Seed database with demo data
- `pnpm db:push` - Push schema changes to database (development only)
- `pnpm db:reset` - Reset database and run migrations

## Database Models

### Core Entities
- **User** - User accounts and authentication
- **Workspace** - Team workspaces
- **WorkspaceMember** - Workspace membership and roles
- **Project** - Projects within workspaces
- **Task** - Work items with status, priority, and assignments

### Task Management
- **TaskAssignee** - Task assignments (many-to-many)
- **TaskLabel** - Task labels (many-to-many)
- **Label** - Color-coded task tags
- **Subtask** - Checklist items within tasks
- **Comment** - Threaded comments on tasks
- **Attachment** - File attachments

### Sprint Management
- **Sprint** - Time-boxed iterations
- **SprintTask** - Tasks within sprints

### System
- **Activity** - Audit log for all changes
- **Integration** - Third-party integrations (Slack, GitHub, etc.)
- **PasswordReset** - Password reset tokens
- **Invitation** - Workspace invitation tokens

## Usage

```typescript
import { prisma } from '@teamflow/database';

// Example: Fetch all tasks for a project
const tasks = await prisma.task.findMany({
  where: { projectId: 'project-id' },
  include: {
    assignees: { include: { user: true } },
    labels: { include: { label: true } },
  },
});
```

## Environment Variables

Required environment variables:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/teamflow_dev"
```
