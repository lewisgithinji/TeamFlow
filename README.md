# TeamFlow

AI-powered project management SaaS for development teams.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js 20, Express, TypeScript, Prisma
- **Database**: PostgreSQL 16, Redis 7
- **AI**: OpenAI GPT-4, Anthropic Claude
- **Infrastructure**: Vercel (Frontend), Railway (Backend)

## Project Structure

```
teamflow/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   ├── ui/           # Shared UI components (shadcn/ui)
│   ├── database/     # Prisma schema & client
│   ├── validators/   # Zod schemas
│   ├── types/        # TypeScript types
│   └── utils/        # Utility functions
├── docs/             # Documentation
└── infrastructure/   # Docker, deployment configs
```

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose (for local development)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Docker Services (PostgreSQL + Redis)

```bash
cd infrastructure
docker-compose up -d
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run Database Migrations

```bash
pnpm db:migrate
pnpm db:seed  # Optional: seed with sample data
```

### 5. Start Development Servers

```bash
pnpm dev
```

This will start:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api-docs

## Available Scripts

### Root Commands

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all files with Prettier
- `pnpm type-check` - Type check all packages
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio (database GUI)

### App-Specific Commands

```bash
# Frontend (Next.js)
pnpm --filter @teamflow/web dev
pnpm --filter @teamflow/web build
pnpm --filter @teamflow/web test

# Backend (Express)
pnpm --filter @teamflow/api dev
pnpm --filter @teamflow/api build
pnpm --filter @teamflow/api test
```

## Project Documentation

- [PRD](docs/brainstorm/03-prd.md) - Product Requirements Document
- [Data Models](docs/model/data-models.md) - Database schema and ERD
- [User Flows](docs/model/user-flows.md) - User flow diagrams
- [State Machines](docs/model/state-machines.md) - State transition diagrams
- [API Contracts](docs/model/api-contracts.md) - REST API specification
- [System Interactions](docs/model/system-interactions.md) - Sequence diagrams
- [System Design](docs/architecture/01-system-design.md) - Architecture overview
- [Tech Stack](docs/architecture/02-tech-stack.md) - Technology decisions
- [Directory Structure](docs/architecture/03-directory-structure.md) - Project structure

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add task breakdown AI feature
fix: resolve task update race condition
docs: update API documentation
refactor: improve task service performance
test: add tests for sprint planning
chore: update dependencies
```

### Creating a Feature

1. Create a branch from `develop`:

   ```bash
   git checkout -b feature/task-breakdown
   ```

2. Make your changes

3. Run checks before committing:

   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. Commit using conventional commits:

   ```bash
   git commit -m "feat: add AI task breakdown"
   ```

5. Push and create a Pull Request

## Testing

### Unit Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @teamflow/api test

# Watch mode
pnpm --filter @teamflow/api test:watch
```

### E2E Tests

```bash
# Frontend E2E (Playwright)
pnpm --filter @teamflow/web test:e2e

# Run in UI mode
pnpm --filter @teamflow/web test:e2e --ui
```

## Deployment

### Frontend (Vercel)

Connected to GitHub. Automatic deployments on push to `main`.

### Backend (Railway)

Connected to GitHub. Automatic deployments on push to `main`.

### Environment Variables

Ensure all required environment variables are set in:

- Vercel Dashboard (for frontend)
- Railway Dashboard (for backend)

See `.env.example` for required variables.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000 or 4000
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

### Database Connection Issues

```bash
# Restart Docker services
cd infrastructure
docker-compose down
docker-compose up -d

# Check if services are running
docker-compose ps
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
cd packages/database
pnpm prisma generate
```

### Clear All Caches

```bash
# Root
pnpm clean

# Individual apps
pnpm --filter @teamflow/web clean
pnpm --filter @teamflow/api clean
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and questions:

- GitHub Issues: [github.com/teamflow/teamflow/issues](https://github.com/teamflow/teamflow/issues)
- Documentation: [docs/](docs/)
- Email: support@teamflow.com
