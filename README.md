# TeamFlow

<div align="center">

**AI-Powered Agile Project Management Platform**

Modern, real-time collaboration tool for development teams with intelligent automation and seamless integrations.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API](#-api-overview)

</div>

---

## 📖 Overview

Enterprise-grade agile project management platform built for modern development teams. This production-ready full-stack application combines real-time WebSocket collaboration, intelligent workflow automation, AI-powered planning, and seamless third-party integrations (Slack, GitHub) in a scalable monorepo architecture.

### 🎯 Project Highlights

- **Full-Stack Architecture**: Next.js 14 frontend + Express.js backend in Turborepo monorepo with TypeScript throughout
- **Real-time Collaboration**: WebSocket-powered live updates using Socket.io with Redis adapter for horizontal scaling
- **Enterprise Features**: Multi-workspace support, JWT auth with refresh tokens, role-based access control, file attachments, activity audit trails
- **Advanced Integrations**: OAuth-based Slack integration with rich notifications, GitHub API integration for PR tracking (coming soon)
- **AI-Powered**: GPT-4/Claude integration for intelligent task breakdown and sprint planning automation
- **Production Infrastructure**: Docker containerization, PostgreSQL 16 + Prisma ORM, Redis caching, Cloudflare R2 storage

This project demonstrates expertise in full-stack TypeScript development, microservices architecture, real-time systems, database design, third-party API integration, and scalable deployment patterns.

**🌐 Live Demo**: Contact for deployment link

### 💼 Key Technologies

| Category               | Technologies                                           |
| ---------------------- | ------------------------------------------------------ |
| **Frontend**           | Next.js 14, React 18, TypeScript 5.3, Tailwind CSS 3.4 |
| **Backend**            | Node.js 20, Express.js, TypeScript 5.3                 |
| **Database**           | PostgreSQL 16, Prisma ORM, Redis 7                     |
| **Real-time**          | Socket.io, Redis Adapter                               |
| **Authentication**     | JWT (Access + Refresh Tokens), RBAC                    |
| **State Management**   | React Query, Zustand                                   |
| **Forms & Validation** | React Hook Form, Zod                                   |
| **Monorepo**           | Turborepo, pnpm Workspaces                             |
| **Infrastructure**     | Docker, Docker Compose                                 |
| **AI/ML**              | OpenAI GPT-4, Anthropic Claude                         |
| **Integrations**       | Slack OAuth API, GitHub API, Resend Email              |
| **Storage**            | Cloudflare R2                                          |
| **Deployment**         | Vercel (Frontend), Railway (Backend)                   |

**Built for modern teams who need:**

- Real-time task updates and notifications
- Intelligent workflow automation
- Seamless integrations (Slack, GitHub)
- Advanced search and filtering
- AI-powered task breakdown and sprint planning

---

## ✨ Features

### Core Features (Production Ready)

- ✅ **Authentication & Authorization** - JWT-based auth with role-based access control
- ✅ **Workspace Management** - Multi-workspace support with team collaboration
- ✅ **Project Management** - Organize work with projects, sprints, and kanban boards
- ✅ **Task Management** - Create, assign, prioritize, and track tasks with full lifecycle
- ✅ **Real-time Collaboration** - WebSocket-powered live updates across all clients
- ✅ **Comments & Mentions** - Threaded discussions with @mentions
- ✅ **Activity Feed** - Complete audit trail of all workspace activities
- ✅ **Team Invitations** - Email-based team member invitations with role assignment
- ✅ **Notifications** - Real-time in-app and email notifications
- ✅ **File Attachments** - Upload and attach files to tasks (supports images, PDFs, documents)

### Advanced Features

- ✅ **Advanced Search** - Full-text search with PostgreSQL, smart filters, saved presets
- ✅ **Slack Integration** - OAuth-based integration with rich notifications and interactive messages
- ✅ **Workflow Automation** - Visual workflow builder with triggers, conditions, and actions
- ⏳ **GitHub Integration** - Link PRs to tasks, auto-status updates (coming soon)
- ⏳ **AI Task Breakdown** - Generate subtasks and estimates using GPT-4/Claude (coming soon)
- ⏳ **AI Sprint Planning** - Intelligent task distribution and velocity prediction (coming soon)

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Custom components with Headless UI
- **State Management**: React Query + Zustand
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form + Zod validation

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7
- **Real-time**: Socket.io with Redis adapter
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod schemas

### Infrastructure

- **Monorepo**: Turborepo + pnpm workspaces
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (frontend), Railway (backend)
- **Storage**: Cloudflare R2 (file uploads)

### AI & Integrations

- **AI Models**: OpenAI GPT-4, Anthropic Claude
- **Integrations**: Slack API, GitHub API
- **Email**: Resend
- **Monitoring**: Sentry (optional)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.0.0 or higher
- **pnpm** 8.0.0 or higher
- **Docker** and **Docker Compose** (for PostgreSQL + Redis)
- **Git** (for version control)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/lewisgithinji/TeamFlow.git
cd TeamFlow
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Docker Services

Start PostgreSQL and Redis in the background:

```bash
cd infrastructure
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

### 4. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

**Required environment variables:**

```env
# Database
DATABASE_URL="postgresql://teamflow:dev_password@localhost:5432/teamflow_dev"
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"

# Frontend URL
FRONTEND_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="http://localhost:4000"

# Backend
PORT=4000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3001"
```

**Optional (for full functionality):**

- `OPENAI_API_KEY` - For AI features
- `RESEND_API_KEY` - For email notifications
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` - For Slack integration
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` - For file uploads

### 5. Run Database Migrations

```bash
pnpm db:migrate
```

Optionally, seed the database with demo data:

```bash
pnpm db:seed
```

### 6. Start Development Servers

```bash
pnpm dev
```

This starts both the frontend and backend in development mode:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

### 7. Open Prisma Studio (Optional)

To explore the database visually:

```bash
pnpm db:studio
```

Visit http://localhost:5555

---

## 📦 Available Scripts

### Root Commands

```bash
pnpm dev              # Start all apps in development mode
pnpm build            # Build all apps for production
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm format           # Format all files with Prettier
pnpm type-check       # Type check all packages
```

### Database Commands

```bash
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Prisma Studio (database GUI)
pnpm db:generate      # Generate Prisma client
```

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

---

## 📁 Project Structure

```
TeamFlow/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/           # Next.js app router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Client libraries & utilities
│   │   │   └── hooks/         # Custom React hooks
│   │   └── public/            # Static assets
│   │
│   └── api/                    # Express backend application
│       ├── src/
│       │   ├── modules/       # Feature modules (auth, tasks, etc.)
│       │   ├── middleware/    # Express middleware
│       │   ├── services/      # Business logic services
│       │   ├── utils/         # Utility functions
│       │   └── websocket/     # Socket.io server
│       └── tests/             # Backend tests
│
├── packages/                   # Shared packages
│   ├── database/              # Prisma schema & migrations
│   ├── types/                 # Shared TypeScript types
│   ├── validators/            # Zod validation schemas
│   ├── utils/                 # Shared utility functions
│   ├── email/                 # Email templates
│   ├── ui/                    # Shared UI components (future)
│   ├── typescript-config/     # Shared TypeScript configs
│   └── eslint-config/         # Shared ESLint configs
│
├── docs/                       # Documentation
│   ├── architecture/          # System design & architecture
│   ├── features/              # Feature documentation
│   ├── brainstorm/            # Product requirements
│   └── model/                 # Data models & API contracts
│
├── infrastructure/             # Docker & deployment configs
│   └── docker-compose.yml     # PostgreSQL + Redis setup
│
└── scripts/                    # Utility scripts
```

---

## 🔌 API Overview

### Authentication Endpoints

```
POST   /api/auth/register            # Register new user
POST   /api/auth/login               # Login user
POST   /api/auth/refresh-token       # Refresh access token
POST   /api/auth/logout              # Logout user
POST   /api/auth/forgot-password     # Request password reset
POST   /api/auth/reset-password      # Reset password
GET    /api/auth/verify-email        # Verify email address
```

### Workspace Endpoints

```
GET    /api/workspaces               # List user's workspaces
POST   /api/workspaces               # Create workspace
GET    /api/workspaces/:id           # Get workspace details
PATCH  /api/workspaces/:id           # Update workspace
DELETE /api/workspaces/:id           # Delete workspace
GET    /api/workspaces/:id/members   # List workspace members
POST   /api/workspaces/:id/members   # Add member
```

### Task Endpoints

```
GET    /api/workspaces/:id/tasks     # List tasks with filters
POST   /api/workspaces/:id/tasks     # Create task
GET    /api/tasks/:id                # Get task details
PATCH  /api/tasks/:id                # Update task
DELETE /api/tasks/:id                # Delete task
POST   /api/tasks/:id/assign         # Assign task to user
POST   /api/tasks/:id/comments       # Add comment
```

### Search & Filter

```
GET    /api/search/tasks             # Search tasks with filters
GET    /api/search/suggestions       # Get search suggestions
POST   /api/search/filters           # Create saved filter
GET    /api/search/filters/:workspaceId  # List saved filters
```

### Automation

```
GET    /api/workspaces/:id/automation/rules      # List automation rules
POST   /api/workspaces/:id/automation/rules      # Create automation rule
PATCH  /api/workspaces/:id/automation/rules/:id  # Update rule
DELETE /api/workspaces/:id/automation/rules/:id  # Delete rule
```

### Slack Integration

```
GET    /api/slack/oauth/start        # Start OAuth flow
GET    /api/slack/oauth/callback     # OAuth callback
POST   /api/slack/oauth/complete     # Complete OAuth setup
GET    /api/slack/integration/:id    # Get integration status
DELETE /api/slack/integration/:id    # Disconnect Slack
```

**Full API Documentation**: See [docs/model/api-contracts.md](docs/model/api-contracts.md)

---

## 🧪 Testing

### Unit Tests

```bash
# All packages
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Frontend E2E tests (Playwright)
pnpm --filter @teamflow/web test:e2e

# Run in UI mode
pnpm --filter @teamflow/web test:e2e --ui
```

---

## 🚢 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
3. Deploy automatically on push to `main`

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard (see `.env.example`)
3. Add PostgreSQL and Redis services
4. Deploy automatically on push to `main`

### Environment Variables Checklist

**Required for Production:**

- ✅ `DATABASE_URL` (PostgreSQL connection string)
- ✅ `REDIS_URL` (Redis connection string)
- ✅ `JWT_SECRET` & `JWT_REFRESH_SECRET`
- ✅ `FRONTEND_URL` & `CORS_ORIGIN`
- ✅ `NODE_ENV=production`

**Optional (features):**

- `OPENAI_API_KEY` - AI features
- `RESEND_API_KEY` - Email notifications
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` - Slack integration
- `R2_*` credentials - File uploads
- `SENTRY_DSN` - Error monitoring

---

## 📚 Documentation

- **[Product Requirements](docs/brainstorm/03-prd.md)** - Product vision and requirements
- **[System Architecture](docs/architecture/01-system-design.md)** - High-level architecture
- **[Data Models](docs/model/data-models.md)** - Database schema and ERD
- **[API Contracts](docs/model/api-contracts.md)** - Complete API specification
- **[User Flows](docs/model/user-flows.md)** - User journey diagrams
- **[Development Status](docs/DEVELOPMENT-STATUS.md)** - Current implementation status
- **[Feature Documentation](docs/features/)** - Detailed feature guides

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues

```bash
# Restart Docker services
cd infrastructure
docker-compose down
docker-compose up -d

# Check if services are running
docker-compose ps

# Check logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma client
pnpm db:generate

# Reset database (WARNING: deletes all data)
pnpm --filter @teamflow/database prisma migrate reset
```

### Clear Build Caches

```bash
# Clear all caches and rebuild
rm -rf node_modules .turbo dist .next
pnpm install
pnpm build
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Run tests and linting** (`pnpm test && pnpm lint`)
5. **Commit using conventional commits** (`git commit -m 'feat: add amazing feature'`)
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

---

## 🔐 Security

### Reporting Vulnerabilities

If you discover a security vulnerability, please email security@teamflow.com instead of opening a public issue.

### Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Account lockout after failed login attempts
- ✅ Input validation with Zod
- ✅ CORS protection
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting (production)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Credits

### Development

**SirLewis** - Lead Developer & Architect
🌐 https://sirlewis.pages.dev/

### Client & Domain Expertise

**Datacare Solutions** - Information Management Specialists
🌐 https://datacare.co.ke

---

## 🙏 Acknowledgments

Built with:

- [Next.js](https://nextjs.org/) - React framework
- [Express](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Socket.io](https://socket.io/) - Real-time engine
- [Turborepo](https://turbo.build/) - Monorepo tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

## 📧 Contact & Support

- **GitHub Issues**: [github.com/lewisgithinji/TeamFlow/issues](https://github.com/lewisgithinji/TeamFlow/issues)
- **Documentation**: [docs/](docs/)
- **Website**: https://sirlewis.pages.dev/

---

<div align="center">

**Made with ❤️ by the TeamFlow Team**

[⬆ Back to Top](#teamflow)

</div>
