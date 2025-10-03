# TeamFlow Setup Guide

Complete setup instructions for the TeamFlow project.

## Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8.14.0+ (Installed automatically or run `npm install -g pnpm@8.14.0`)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the monorepo including:

- Root workspace dependencies
- Frontend (Next.js) dependencies
- Backend (Express) dependencies
- All shared packages

### 2. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
cd infrastructure
docker-compose up -d
```

Verify containers are running:

```bash
docker ps
```

You should see `teamflow-postgres` and `teamflow-redis` running.

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your values. For local development, the defaults should work:

```bash
# Database (default Docker Compose values)
DATABASE_URL="postgresql://teamflow:dev_password@localhost:5432/teamflow_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate new ones for production!)
JWT_SECRET="your-secret-key-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Frontend URL
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Providers (optional for MVP)
OPENAI_API_KEY="sk-..."  # Get from https://platform.openai.com/api-keys
ANTHROPIC_API_KEY="sk-ant-..."  # Get from https://console.anthropic.com/

# Email (optional for MVP - Resend)
RESEND_API_KEY="re_..."  # Get from https://resend.com/api-keys
RESEND_FROM_EMAIL="noreply@teamflow.dev"

# Development
NODE_ENV="development"
PORT="4000"
```

### 4. Generate Prisma Client

Generate the Prisma client from the schema:

```bash
pnpm db:generate
```

### 5. Run Database Migrations

Create the database tables:

```bash
pnpm db:migrate
```

When prompted for a migration name, you can use: `init`

### 6. Seed the Database (Optional)

Populate the database with demo data:

```bash
pnpm db:seed
```

This creates:

- Demo user: `demo@teamflow.dev` / `password123`
- Demo workspace: "Demo Workspace"
- Demo project: "Demo Project"
- Sample tasks and labels

### 7. Start Development Servers

Start all development servers (frontend + backend):

```bash
pnpm dev
```

This runs:

- **Frontend** (Next.js): http://localhost:3000
- **Backend** (Express API): http://localhost:4000

Or start them individually:

```bash
# Frontend only
pnpm --filter @teamflow/web dev

# Backend only
pnpm --filter @teamflow/api dev
```

## Project Structure

```
teamflow/
├── apps/
│   ├── web/                # Next.js frontend
│   └── api/                # Express backend
├── packages/
│   ├── database/           # Prisma schema & client
│   ├── validators/         # Zod validation schemas
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Shared utility functions
│   ├── ui/                 # Shared UI components (shadcn/ui)
│   ├── typescript-config/  # Shared TypeScript configs
│   └── eslint-config/      # Shared ESLint configs
├── docs/                   # Documentation
├── infrastructure/         # Docker & deployment configs
└── scripts/                # Build & deployment scripts
```

## Database Management

### View Database with Prisma Studio

```bash
pnpm db:studio
```

Opens a web UI at http://localhost:5555 to browse and edit database data.

### Create a New Migration

After modifying `packages/database/prisma/schema.prisma`:

```bash
pnpm db:migrate
```

### Reset Database

⚠️ **Warning**: This will delete all data and re-run migrations.

```bash
cd packages/database
pnpm db:reset
```

### Push Schema Changes (Development Only)

For rapid prototyping, push schema changes without creating migrations:

```bash
cd packages/database
pnpm db:push
```

## Available Scripts

### Root Level

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code with Prettier
- `pnpm type-check` - TypeScript type checking

### Database (packages/database)

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed database
- `pnpm db:push` - Push schema changes (dev only)
- `pnpm db:reset` - Reset database

### Frontend (apps/web)

- `pnpm --filter @teamflow/web dev` - Start dev server
- `pnpm --filter @teamflow/web build` - Build for production
- `pnpm --filter @teamflow/web start` - Start production server
- `pnpm --filter @teamflow/web lint` - Lint frontend code

### Backend (apps/api)

- `pnpm --filter @teamflow/api dev` - Start dev server
- `pnpm --filter @teamflow/api build` - Build for production
- `pnpm --filter @teamflow/api start` - Start production server
- `pnpm --filter @teamflow/api test` - Run API tests

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Tests for Specific Package

```bash
pnpm --filter @teamflow/api test
```

### Watch Mode

```bash
pnpm --filter @teamflow/api test -- --watch
```

## Troubleshooting

### Port Already in Use

If port 3000 or 4000 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

Or change the ports in `.env`:

```bash
PORT=4001  # Backend
NEXT_PUBLIC_API_URL=http://localhost:4001
```

### Database Connection Error

Verify PostgreSQL is running:

```bash
docker ps | grep teamflow-postgres
```

If not running, start it:

```bash
cd infrastructure
docker-compose up -d postgres
```

Check database logs:

```bash
docker logs teamflow-postgres
```

### Prisma Client Not Generated

If you see "Cannot find module '@prisma/client'":

```bash
pnpm db:generate
```

### Node Modules Issues

If you encounter dependency issues:

```bash
# Clean all node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Clean pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

### TypeScript Errors

Clear TypeScript build cache:

```bash
# Find and remove all tsconfig.tsbuildinfo files
find . -name "*.tsbuildinfo" -delete

# Re-run type check
pnpm type-check
```

## Docker Compose Services

### Stop Services

```bash
cd infrastructure
docker-compose down
```

### View Logs

```bash
docker logs teamflow-postgres -f  # Postgres logs
docker logs teamflow-redis -f     # Redis logs
```

### Connect to PostgreSQL

```bash
docker exec -it teamflow-postgres psql -U teamflow -d teamflow_dev
```

### Connect to Redis CLI

```bash
docker exec -it teamflow-redis redis-cli
```

## Production Build

### Build All Packages

```bash
pnpm build
```

This builds:

1. Shared packages (database, types, validators, utils)
2. Frontend (Next.js optimized build)
3. Backend (TypeScript compiled to JavaScript)

### Test Production Build Locally

```bash
# Build everything
pnpm build

# Start frontend
cd apps/web && pnpm start

# Start backend (in another terminal)
cd apps/api && pnpm start
```

## VS Code Setup

### Recommended Extensions

The workspace is configured with recommended extensions in `.vscode/extensions.json`:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- TypeScript and JavaScript Language Features

Install them by opening the Extensions panel and searching for "@recommended".

### Workspace Settings

The project includes `.vscode/settings.json` with:

- Format on save (Prettier)
- ESLint auto-fix on save
- TypeScript SDK from workspace
- Excluded folders (node_modules, .next, dist)

## Git Hooks

Husky git hooks are configured to run:

### Pre-commit

- Lint and format staged files (lint-staged)
- Run type checking

### Commit Message

- Validate commit message format (Conventional Commits)

Format: `type(scope): message`

Examples:

- `feat(auth): add password reset functionality`
- `fix(api): resolve task assignment bug`
- `docs: update setup instructions`

## Next Steps

1. ✅ Setup complete - servers running!
2. 📖 Read the [Architecture Documentation](docs/architecture/)
3. 🎯 Check [Sprint 1 Planning](docs/sprints/sprint-1/planning.md)
4. 🚀 Start building features!

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Socket.io Documentation](https://socket.io/docs)

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review the [docs/](docs/) folder
3. Check existing GitHub issues
4. Create a new GitHub issue with:
   - What you tried
   - Error messages
   - Environment details (OS, Node version, etc.)
