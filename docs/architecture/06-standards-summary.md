# Coding Standards - Quick Reference

**Version**: 1.0
**Last Updated**: 2025-01-22

This is a quick reference for the comprehensive coding standards. See [05-coding-standards.md](05-coding-standards.md) for full details.

## ✅ What's Automated

### Prettier (Code Formatting)
- **Auto-fix**: On save (VS Code)
- **Pre-commit**: Runs on staged files
- **CI**: Checks on PR

**Key Rules**:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### ESLint (Code Quality)
- **Auto-fix**: On save (VS Code)
- **Pre-commit**: Runs on staged files
- **CI**: Checks on PR

**Key Rules**:
- No unused variables (except `_` prefix)
- Consistent type imports
- React best practices

### TypeScript (Type Safety)
- **Compile-time**: `pnpm type-check`
- **CI**: Checks on PR

**Key Rules**:
- Strict mode enabled
- No implicit `any`
- No unused locals

### Commitlint (Commit Messages)
- **Pre-commit**: Validates message format
- **CI**: Checks on PR

**Format**: `type(scope): message`

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

### Husky + lint-staged (Git Hooks)
- **Pre-commit**: Lint + format staged files
- **Commit-msg**: Validate commit message

## 📋 File Naming Conventions

### Components
```
✅ TaskCard.tsx
✅ Button.tsx
❌ task-card.tsx
❌ taskCard.tsx
```

### Utilities & Hooks
```
✅ useAuth.ts
✅ apiClient.ts
✅ formatDate.ts
❌ UseAuth.ts
❌ api-client.ts
```

### Types
```
✅ api.types.ts
✅ socket.types.ts
❌ apiTypes.ts
```

### Tests
```
✅ auth.service.test.ts
✅ TaskCard.test.tsx
❌ auth-test.ts
```

## 🎯 Quick Tips

### Variables
```typescript
// ✅ Good
const isLoading = true;
const hasPermission = false;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ❌ Bad
const loading = true;
const permission = false;
const maxFileSize = 10485760;
```

### Imports
```typescript
// ✅ Good: Correct order
import React from 'react';                    // External
import { Button } from '@teamflow/ui';         // Workspace
import { useAuth } from '@/hooks/useAuth';     // Internal
import { TaskCard } from './TaskCard';         // Relative
import type { Task } from '@teamflow/types';   // Types (separate)
```

### TypeScript
```typescript
// ✅ Good: Explicit types
function createTask(data: CreateTaskInput): Promise<Task> {
  return apiClient.post('/tasks', data);
}

// ✅ Good: Use interfaces for objects
interface User {
  id: string;
  name: string;
}

// ✅ Good: Use types for unions
type TaskStatus = 'todo' | 'in_progress' | 'done';
```

### React
```typescript
// ✅ Good: Destructure props
function TaskCard({ task, onUpdate }: TaskCardProps) {
  return <div>{task.title}</div>;
}

// ✅ Good: Functional state updates
setCount((prev) => prev + 1);

// ✅ Good: useCallback for props
const handleClick = useCallback(() => {
  doSomething(task.id);
}, [task.id]);
```

### API Routes
```typescript
// ✅ Good: RESTful endpoints
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id

// ✅ Good: Consistent response format
{
  "task": { ... }
}

{
  "tasks": [...],
  "pagination": { ... }
}
```

### Testing
```typescript
// ✅ Good: AAA pattern
describe('TaskService.create', () => {
  it('should create task when data is valid', async () => {
    // Arrange
    const taskData = { title: 'Test' };

    // Act
    const task = await taskService.create(taskData);

    // Assert
    expect(task.title).toBe('Test');
  });
});
```

## 🔐 Security Checklist

- [ ] User input validated (Zod)
- [ ] Auth checked in middleware
- [ ] Authorization checked in service
- [ ] No secrets hardcoded
- [ ] No SQL injection (use Prisma)
- [ ] No XSS (React escapes by default)

## ⚡ Performance Checklist

- [ ] No N+1 queries
- [ ] Indexes on queried columns
- [ ] Pagination for large lists
- [ ] `useMemo` for expensive computations
- [ ] `useCallback` for event handlers passed as props
- [ ] Code splitting with dynamic imports
- [ ] Redis caching for frequent queries

## 📝 Documentation Checklist

- [ ] Complex logic has comments (WHY, not WHAT)
- [ ] Public functions have JSDoc
- [ ] README in major directories
- [ ] API endpoints documented (OpenAPI)

## 🔍 Code Review Checklist

### For Authors
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] Self-reviewed the code
- [ ] Added tests for new functionality
- [ ] Updated documentation
- [ ] No console.log or debugger
- [ ] No commented-out code
- [ ] Commit messages follow convention

### For Reviewers
- [ ] Functionality works as expected
- [ ] Security: auth, validation, no secrets
- [ ] Performance: no N+1, indexes, caching
- [ ] Code quality: readable, maintainable, DRY
- [ ] Tests are meaningful
- [ ] Documentation updated

## 🚀 Quick Commands

### Development
```bash
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm format           # Format all files
pnpm type-check       # Type check all packages
```

### Git
```bash
git commit -m "feat: add task breakdown"
git commit -m "fix: resolve race condition"
git commit -m "docs: update API docs"
```

### Pre-commit Hook
Automatically runs on `git commit`:
1. ESLint auto-fix
2. Prettier format
3. Commit message validation

If any step fails, commit is aborted.

## 📚 Resources

- [Full Coding Standards](05-coding-standards.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React Best Practices](https://react.dev/learn)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Quick Start**: Run `pnpm prepare` to set up git hooks, then commit as usual. Standards are enforced automatically!
