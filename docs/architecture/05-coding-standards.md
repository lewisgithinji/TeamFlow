# TeamFlow Coding Standards

**Version**: 1.0
**Last Updated**: 2025-01-22
**Status**: Approved for Implementation

This document defines comprehensive coding standards for the TeamFlow project. These standards are enforced through automated tools and code review.

## Table of Contents
1. [Code Style (Automated)](#1-code-style-automated)
2. [TypeScript Guidelines](#2-typescript-guidelines)
3. [React Guidelines](#3-react-guidelines)
4. [API Design Guidelines](#4-api-design-guidelines)
5. [Testing Standards](#5-testing-standards)
6. [Git Workflow](#6-git-workflow)
7. [Security Standards](#7-security-standards)
8. [Performance Guidelines](#8-performance-guidelines)
9. [Documentation Standards](#9-documentation-standards)
10. [Code Review Checklist](#10-code-review-checklist)

---

## 1. Code Style (Automated)

All code style is enforced automatically by Prettier and ESLint.

### Prettier Configuration

**File**: `.prettierrc.json` (already created)

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

**Why these rules**:
- `semi: true` - Explicit semicolons prevent ASI bugs
- `singleQuote: true` - Consistency, fewer escape sequences in JSX
- `printWidth: 100` - Readable on modern screens, less line breaks
- `tabWidth: 2` - Standard for JavaScript/TypeScript
- `arrowParens: "always"` - Consistency, easier to add types later
- `endOfLine: "lf"` - Unix-style line endings (cross-platform)

### ESLint Rules

Configured in `packages/eslint-config/`.

**Key Rules**:
- `@typescript-eslint/no-unused-vars` - Error (except `_` prefix)
- `@typescript-eslint/no-explicit-any` - Warn (not error, for gradual typing)
- `@typescript-eslint/consistent-type-imports` - Warn (separate type imports)
- `react/react-in-jsx-scope` - Off (Next.js auto-imports React)
- `react/prop-types` - Off (TypeScript handles this)

### File Naming Conventions

#### Components (React)
```
✅ TaskCard.tsx          # PascalCase
✅ Button.tsx
✅ UserAvatar.tsx

❌ task-card.tsx         # Wrong: kebab-case
❌ taskCard.tsx          # Wrong: camelCase
```

#### Utilities & Hooks
```
✅ useAuth.ts            # camelCase with "use" prefix for hooks
✅ apiClient.ts          # camelCase
✅ formatDate.ts

❌ UseAuth.ts            # Wrong: PascalCase
❌ api-client.ts         # Wrong: kebab-case
```

#### Types & Interfaces
```
✅ api.types.ts          # Descriptive name + .types.ts
✅ socket.types.ts
✅ models.ts             # If entire file is types

❌ apiTypes.ts           # Wrong: camelCase without .types
❌ api-types.ts          # Wrong: kebab-case
```

#### Tests
```
✅ auth.service.test.ts  # Match source file + .test.ts
✅ TaskCard.test.tsx     # Component tests

❌ auth-test.ts          # Wrong: not matching source
❌ test-auth.ts          # Wrong: wrong order
```

#### API Routes (Express)
```
✅ tasks.routes.ts       # Plural noun + .routes.ts
✅ auth.routes.ts        # Exception: auth (not auths)
✅ users.routes.ts

❌ task.routes.ts        # Wrong: singular
❌ tasksRoutes.ts        # Wrong: camelCase
```

#### Next.js App Router
```
✅ page.tsx              # Next.js convention
✅ layout.tsx
✅ loading.tsx
✅ error.tsx

✅ (auth)/               # Route groups: kebab-case in parens
✅ [taskId]/             # Dynamic routes: camelCase in brackets
✅ forgot-password/      # Folder names: kebab-case

❌ Page.tsx              # Wrong: PascalCase
❌ (Auth)/               # Wrong: PascalCase in route group
```

### Variable Naming

```typescript
// ✅ Good: Descriptive, intention-revealing names
const taskCount = tasks.length;
const isAuthenticated = !!user;
const hasUnreadNotifications = notifications.some((n) => !n.read);

// ❌ Bad: Abbreviations, unclear purpose
const tc = tasks.length;
const auth = !!user;
const notif = notifications.some((n) => !n.read);

// ✅ Good: Boolean names
const isLoading = true;
const hasPermission = false;
const canEdit = user.role === 'owner';

// ❌ Bad: Non-boolean names for booleans
const loading = true;
const permission = false;
const edit = user.role === 'owner';

// ✅ Good: Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const API_BASE_URL = 'https://api.teamflow.com';

// ✅ Good: Magic numbers as named constants
const TASK_TITLE_MAX_LENGTH = 255;
const DEBOUNCE_DELAY = 300;
```

### Import Order

Automatically enforced by ESLint. Order:

1. External dependencies (React, Next.js, etc.)
2. Internal workspace packages (`@teamflow/*`)
3. Internal app modules (`@/*`)
4. Relative imports (`./`, `../`)
5. Type imports (separated with `type` keyword)

```typescript
// ✅ Good: Correct order
import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@teamflow/ui/components/button';
import { createTaskSchema } from '@teamflow/validators';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

import { TaskCard } from './TaskCard';
import { BoardColumn } from './BoardColumn';

import type { Task } from '@teamflow/types';
import type { TaskStatus } from './types';

// ❌ Bad: Random order
import { TaskCard } from './TaskCard';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@teamflow/ui/components/button';
```

---

## 2. TypeScript Guidelines

### Type Safety

```typescript
// ✅ Good: Explicit types for function parameters and returns
function createTask(data: CreateTaskInput): Promise<Task> {
  return apiClient.post('/tasks', data);
}

// ❌ Bad: Implicit any
function createTask(data) {
  return apiClient.post('/tasks', data);
}

// ✅ Good: Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
}

// ✅ Good: Use type for unions, intersections, mapped types
type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskWithAssignees = Task & { assignees: User[] };

// ✅ Good: Avoid any, use unknown when type is truly unknown
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  throw new Error('Invalid data type');
}

// ❌ Bad: Using any
function processData(data: any) {
  return data.toUpperCase();
}
```

### Type vs Interface

**Use `interface` for**:
- Object shapes
- Classes
- When you might extend later

**Use `type` for**:
- Unions
- Intersections
- Mapped types
- Utility types
- Primitives

```typescript
// ✅ Interface for object shapes
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

// ✅ Type for unions
type TaskStatus = 'todo' | 'in_progress' | 'done';

// ✅ Type for intersections
type TaskWithAssignees = Task & { assignees: User[] };

// ✅ Type for mapped types
type Optional<T> = { [K in keyof T]?: T[K] };
```

### Avoid Enums (Use Const Objects or Union Types)

```typescript
// ✅ Good: Union type
type TaskStatus = 'todo' | 'in_progress' | 'done';

// ✅ Good: Const object (if you need both type and values)
const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// ❌ Bad: Enum (generates unnecessary runtime code)
enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}
```

### Type Imports

```typescript
// ✅ Good: Use type imports for types
import type { Task } from '@teamflow/types';
import type { User } from './types';

// ✅ Good: Mixed import
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/lib/api-client';

// ❌ Bad: Regular import for types (worse tree-shaking)
import { Task } from '@teamflow/types';
```

### Nullish Coalescing & Optional Chaining

```typescript
// ✅ Good: Use ?? for default values (not ||)
const name = user?.name ?? 'Anonymous';

// ❌ Bad: || treats falsy values as default trigger
const name = user?.name || 'Anonymous'; // '' becomes 'Anonymous'

// ✅ Good: Optional chaining for nested properties
const avatarUrl = user?.profile?.avatar?.url;

// ❌ Bad: Manual null checks
const avatarUrl = user && user.profile && user.profile.avatar && user.profile.avatar.url;
```

### Generics

```typescript
// ✅ Good: Generic functions
function getById<T>(items: T[], id: string): T | undefined {
  return items.find((item) => (item as any).id === id);
}

// ✅ Good: Generic React components
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}

// Usage with type inference
<List items={tasks} renderItem={(task) => <TaskCard task={task} />} />;
```

---

## 3. React Guidelines

### Component Structure

```typescript
// ✅ Good: Clear component structure
import type { Task } from '@teamflow/types';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  // 1. Hooks (in order: state, refs, context, queries, effects)
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // 2. Derived values
  const canEdit = task.createdBy === user?.id;
  const statusColor = getStatusColor(task.status);

  // 3. Event handlers
  const handleEdit = () => {
    if (canEdit) setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(task);
    setIsEditing(false);
  };

  // 4. Effects (at the end)
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  // 5. Render
  return (
    <div className="task-card">
      {/* Component JSX */}
    </div>
  );
}
```

### Props Destructuring

```typescript
// ✅ Good: Destructure in function signature
function TaskCard({ task, onUpdate }: TaskCardProps) {
  return <div>{task.title}</div>;
}

// ❌ Bad: Props as object
function TaskCard(props: TaskCardProps) {
  return <div>{props.task.title}</div>;
}

// ✅ Good: Default values in destructuring
function TaskCard({ task, variant = 'default', onUpdate }: TaskCardProps) {
  return <div>{task.title}</div>;
}
```

### State Management

```typescript
// ✅ Good: Separate state for separate concerns
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [tasks, setTasks] = useState<Task[]>([]);

// ❌ Bad: Single object for unrelated state
const [state, setState] = useState({
  isLoading: false,
  error: null,
  tasks: [],
});

// ✅ Good: Use useReducer for complex state
const [state, dispatch] = useReducer(taskReducer, initialState);

// ✅ Good: Functional state updates when depending on previous state
setCount((prev) => prev + 1);

// ❌ Bad: Direct state update depending on previous
setCount(count + 1);
```

### Event Handlers

```typescript
// ✅ Good: Inline arrow functions for simple handlers
<Button onClick={() => setIsOpen(true)}>Open</Button>

// ✅ Good: Separate function for complex handlers
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Complex logic here
};

<form onSubmit={handleSubmit}>...</form>

// ❌ Bad: Creating new functions in render (performance issue)
<Button onClick={() => doSomething(task.id)}>Click</Button>

// ✅ Better: useCallback for optimization
const handleClick = useCallback(() => {
  doSomething(task.id);
}, [task.id]);

<Button onClick={handleClick}>Click</Button>
```

### Conditional Rendering

```typescript
// ✅ Good: && for simple conditional
{isLoading && <LoadingSpinner />}

// ✅ Good: Ternary for if-else
{isLoading ? <LoadingSpinner /> : <TaskList tasks={tasks} />}

// ✅ Good: Early return for complex conditionals
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <TaskList tasks={tasks} />;

// ❌ Bad: Nested ternaries (hard to read)
{isLoading ? <LoadingSpinner /> : error ? <ErrorMessage /> : <TaskList />}

// ✅ Better: Component for complex logic
function TaskContent() {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  return <TaskList tasks={tasks} />;
}
```

### Custom Hooks

```typescript
// ✅ Good: Custom hook pattern
function useTaskQuery(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => apiClient.get(`/tasks/${taskId}`),
  });
}

// ✅ Good: Return object for multiple values
function useAuth() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return { user, login, logout, isAuthenticated: !!user };
}

// Usage
const { user, login, logout, isAuthenticated } = useAuth();
```

### Component Composition

```typescript
// ✅ Good: Composition pattern
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// ❌ Bad: Props drilling for every part
<Card header="Title" body="Content" />
```

---

## 4. API Design Guidelines

### REST Conventions

```typescript
// ✅ Good: RESTful endpoints
GET    /api/tasks           # List tasks
POST   /api/tasks           # Create task
GET    /api/tasks/:id       # Get single task
PATCH  /api/tasks/:id       # Update task
DELETE /api/tasks/:id       # Delete task

// Nested resources
GET    /api/projects/:id/tasks    # List tasks in project
POST   /api/tasks/:id/comments    # Add comment to task

// Actions (if not CRUD)
POST   /api/tasks/:id/assign      # Assign task
POST   /api/sprints/:id/complete  # Complete sprint

// ❌ Bad: Non-RESTful endpoints
GET    /api/getTasks
POST   /api/createTask
GET    /api/task?id=123
```

### Request/Response Format

```typescript
// ✅ Good: Consistent response format
{
  "task": {
    "id": "123",
    "title": "Fix bug",
    "status": "todo"
  }
}

// ✅ Good: List responses with metadata
{
  "tasks": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// ✅ Good: Error responses
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Task title is required",
    "details": [
      {
        "field": "title",
        "message": "Required field"
      }
    ]
  }
}

// ❌ Bad: Inconsistent format
{ data: [...] }  // Sometimes data
{ tasks: [...] }  // Sometimes resource name
{ result: [...] }  // Sometimes result
```

### HTTP Status Codes

```typescript
// Success
200 OK              // GET, PATCH successful
201 Created         // POST successful
204 No Content      // DELETE successful

// Client Errors
400 Bad Request     // Validation error
401 Unauthorized    // Not authenticated
403 Forbidden       // Not authorized (authenticated but no permission)
404 Not Found       // Resource doesn't exist
409 Conflict        // Optimistic locking conflict, duplicate
422 Unprocessable   // Semantic validation error

// Server Errors
500 Internal Error  // Server error
503 Service Unavailable  // Service down (DB, Redis, etc.)
```

### Validation

```typescript
// ✅ Good: Validate with Zod in middleware
import { createTaskSchema } from '@teamflow/validators';

router.post('/tasks', validate(createTaskSchema), async (req, res) => {
  // req.body is now typed and validated
  const task = await taskService.create(req.body);
  res.status(201).json({ task });
});

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else {
        next(error);
      }
    }
  };
}
```

---

## 5. Testing Standards

### Test Structure (AAA Pattern)

```typescript
// ✅ Good: Arrange, Act, Assert
describe('TaskService', () => {
  describe('create', () => {
    it('should create a task with valid data', async () => {
      // Arrange
      const taskData = {
        projectId: 'project-1',
        title: 'New task',
        status: 'todo',
      };

      // Act
      const task = await taskService.create(taskData);

      // Assert
      expect(task).toBeDefined();
      expect(task.title).toBe('New task');
      expect(task.status).toBe('todo');
    });
  });
});
```

### Test Naming

```typescript
// ✅ Good: Descriptive test names
it('should create a task when data is valid', async () => {});
it('should throw ValidationError when title is missing', async () => {});
it('should return 404 when task does not exist', async () => {});

// ❌ Bad: Vague test names
it('works', async () => {});
it('test create', async () => {});
it('should work correctly', async () => {});
```

### Unit Tests (Services)

```typescript
// ✅ Good: Test business logic in isolation
describe('TaskService.create', () => {
  beforeEach(() => {
    // Setup: Clear database, seed data
  });

  it('should create task with default status', async () => {
    const task = await taskService.create({
      projectId: 'project-1',
      title: 'Test',
    });

    expect(task.status).toBe('todo');
  });

  it('should assign default position', async () => {
    // Create 2 tasks
    await taskService.create({ projectId: 'project-1', title: 'Task 1' });
    const task2 = await taskService.create({ projectId: 'project-1', title: 'Task 2' });

    expect(task2.position).toBe(1);
  });

  it('should throw error when project does not exist', async () => {
    await expect(
      taskService.create({
        projectId: 'invalid',
        title: 'Test',
      })
    ).rejects.toThrow('Project not found');
  });
});
```

### Integration Tests (API Routes)

```typescript
// ✅ Good: Test API endpoints
describe('POST /api/tasks', () => {
  it('should create task and return 201', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: 'project-1',
        title: 'New task',
      });

    expect(response.status).toBe(201);
    expect(response.body.task).toBeDefined();
    expect(response.body.task.title).toBe('New task');
  });

  it('should return 400 when title is missing', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: 'project-1',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Component Tests (React Testing Library)

```typescript
// ✅ Good: Test user behavior, not implementation
describe('TaskCard', () => {
  it('should display task title', () => {
    const task = { id: '1', title: 'Test task', status: 'todo' };

    render(<TaskCard task={task} onUpdate={jest.fn()} />);

    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('should call onUpdate when edit is saved', async () => {
    const task = { id: '1', title: 'Test task', status: 'todo' };
    const onUpdate = jest.fn();

    render(<TaskCard task={task} onUpdate={onUpdate} />);

    // Click edit button
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Change title
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated task');

    // Save
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated task' })
    );
  });
});
```

### Test Coverage Targets

- **Unit tests**: >80% coverage for services
- **Integration tests**: All critical API endpoints
- **E2E tests**: Critical user flows (auth, task creation, board interaction)

---

## 6. Git Workflow

### Commit Messages (Conventional Commits)

```bash
# ✅ Good: Clear, descriptive commits
feat: add AI task breakdown feature
fix: resolve race condition in task updates
docs: update API documentation
refactor: extract task service into separate file
test: add tests for sprint planning
chore: update dependencies
perf: optimize task list query with indexes
style: format code with Prettier

# With scope
feat(api): add task breakdown endpoint
fix(web): resolve hydration error in task list
test(database): add migration tests

# With breaking change
feat!: change task status enum values

BREAKING CHANGE: Task status values changed from snake_case to camelCase

# ❌ Bad: Vague commits
fix: bug fix
update: changes
WIP: stuff
asdf
```

### Branch Naming

```bash
# ✅ Good: Descriptive branch names
feature/ai-task-breakdown
fix/task-update-race-condition
refactor/task-service-extraction
chore/update-dependencies

# ❌ Bad: Vague names
feature/new-feature
fix/bug
my-branch
test
```

### Pull Request Guidelines

**Title**: Use conventional commit format
```
feat: add AI task breakdown feature
```

**Description Template**:
```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added AIService with OpenAI integration
- Created task breakdown endpoint
- Added loading states for AI features

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Tested manually

## Screenshots (if applicable)
[Screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass
- [ ] Documentation updated
```

---

## 7. Security Standards

### Authentication & Authorization

```typescript
// ✅ Good: Check auth in middleware
router.get('/tasks', authenticate, authorize('member'), async (req, res) => {
  const tasks = await taskService.list(req.user.workspaceId);
  res.json({ tasks });
});

// ✅ Good: Validate ownership in service
async function updateTask(taskId: string, userId: string, data: UpdateTaskInput) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!task) throw new NotFoundError('Task not found');

  // Check permission
  const hasPermission = await checkTaskPermission(task, userId, 'update');
  if (!hasPermission) throw new ForbiddenError('No permission to update task');

  return prisma.task.update({ where: { id: taskId }, data });
}

// ❌ Bad: No permission check
async function updateTask(taskId: string, data: UpdateTaskInput) {
  return prisma.task.update({ where: { id: taskId }, data });
}
```

### Input Validation

```typescript
// ✅ Good: Always validate user input with Zod
const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
});

// Validation happens in middleware BEFORE handler
router.post('/tasks', validate(createTaskSchema), createTask);

// ❌ Bad: No validation
router.post('/tasks', async (req, res) => {
  const task = await prisma.task.create({ data: req.body });
  res.json({ task });
});
```

### SQL Injection Prevention

```typescript
// ✅ Good: Use Prisma (prevents SQL injection)
const tasks = await prisma.task.findMany({
  where: { projectId },
});

// ✅ Good: If using raw SQL, use parameterized queries
const tasks = await prisma.$queryRaw`
  SELECT * FROM tasks WHERE project_id = ${projectId}
`;

// ❌ Bad: String concatenation (SQL injection risk)
const tasks = await prisma.$queryRawUnsafe(
  `SELECT * FROM tasks WHERE project_id = '${projectId}'`
);
```

### XSS Prevention

```typescript
// ✅ Good: React escapes by default
<div>{task.title}</div>

// ✅ Good: Use DOMPurify for user HTML
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(task.description) }} />

// ❌ Bad: dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: task.description }} />
```

### Secrets Management

```typescript
// ✅ Good: Use environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// ✅ Good: Validate env vars on startup with Zod
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
});

const env = envSchema.parse(process.env);

// ❌ Bad: Hardcoded secrets
const JWT_SECRET = 'my-secret-key';
```

---

## 8. Performance Guidelines

### Database Queries

```typescript
// ✅ Good: Use select to fetch only needed fields
const tasks = await prisma.task.findMany({
  select: {
    id: true,
    title: true,
    status: true,
  },
});

// ✅ Good: Use include for relations (Prisma optimizes)
const task = await prisma.task.findUnique({
  where: { id },
  include: {
    assignees: true,
    comments: true,
  },
});

// ❌ Bad: N+1 query
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  task.assignees = await prisma.taskAssignee.findMany({ where: { taskId: task.id } });
}

// ✅ Good: Batch query
const tasks = await prisma.task.findMany({
  include: { assignees: true },
});
```

### React Performance

```typescript
// ✅ Good: useMemo for expensive computations
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => a.position - b.position);
}, [tasks]);

// ✅ Good: useCallback for event handlers passed as props
const handleUpdate = useCallback((task: Task) => {
  updateTaskMutation.mutate(task);
}, [updateTaskMutation]);

// ✅ Good: React.memo for pure components
export const TaskCard = React.memo(({ task, onUpdate }: TaskCardProps) => {
  return <div>{task.title}</div>;
});

// ✅ Good: Code splitting with dynamic imports
const TaskDetail = dynamic(() => import('./TaskDetail'), {
  loading: () => <LoadingSpinner />,
});
```

### Caching

```typescript
// ✅ Good: Cache API responses in Redis
async function getTask(taskId: string): Promise<Task> {
  const cacheKey = `task:${taskId}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Query database
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  // Store in cache (5 min TTL)
  await redis.set(cacheKey, JSON.stringify(task), 'EX', 300);

  return task;
}

// ✅ Good: Invalidate cache on update
async function updateTask(taskId: string, data: UpdateTaskInput) {
  const task = await prisma.task.update({ where: { id: taskId }, data });

  // Invalidate cache
  await redis.del(`task:${taskId}`);

  return task;
}
```

---

## 9. Documentation Standards

### Code Comments

```typescript
// ✅ Good: Comment WHY, not WHAT (code explains what)
// Use exponential backoff to avoid rate limiting from OpenAI
const delay = Math.min(1000 * 2 ** attempt, 10000);

// ✅ Good: Complex business logic
// Task positions are 0-indexed within each status column.
// When moving a task, we need to:
// 1. Remove from old position (decrement positions after it)
// 2. Insert at new position (increment positions after it)
const newPosition = calculatePosition(task, targetStatus, targetIndex);

// ❌ Bad: Obvious comments
// Increment the counter
counter++;

// ❌ Bad: Commented-out code (delete it)
// const oldFunction = () => { ... }
```

### JSDoc for Functions

```typescript
/**
 * Creates a new task in the specified project.
 *
 * @param data - Task creation data (title, description, status, etc.)
 * @param userId - ID of the user creating the task
 * @returns The created task with assigned ID and default values
 * @throws {ValidationError} If task data is invalid
 * @throws {ForbiddenError} If user doesn't have permission to create tasks
 *
 * @example
 * const task = await createTask({
 *   projectId: 'proj_123',
 *   title: 'Fix bug',
 *   status: 'todo'
 * }, 'user_456');
 */
export async function createTask(
  data: CreateTaskInput,
  userId: string
): Promise<Task> {
  // Implementation
}
```

### README Files

Every major directory should have a README:

```markdown
# Task Components

This directory contains all task-related React components.

## Components

- `TaskCard.tsx` - Displays a single task in board/list view
- `TaskDetail.tsx` - Task detail modal with full information
- `TaskForm.tsx` - Create/edit task form
- `TaskList.tsx` - List view of tasks
- `TaskComments.tsx` - Comments section within task detail

## Usage

```tsx
import { TaskCard } from '@/components/task/TaskCard';

<TaskCard
  task={task}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
/>
```

## Notes

- TaskCard uses optimistic updates for instant UI feedback
- TaskDetail lazy-loads comments for performance
```

---

## 10. Code Review Checklist

### For Authors (Before Requesting Review)

- [ ] Code follows style guide (Prettier, ESLint)
- [ ] All tests pass (`pnpm test`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Self-reviewed the code (read your own diff)
- [ ] Added tests for new functionality
- [ ] Updated documentation (README, JSDoc, etc.)
- [ ] No console.log or debugger statements
- [ ] No commented-out code
- [ ] Commit messages follow convention
- [ ] PR description filled out

### For Reviewers

**Functionality**:
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled (null, empty, errors)
- [ ] No obvious bugs

**Security**:
- [ ] User input validated
- [ ] Authentication/authorization checked
- [ ] No secrets hardcoded
- [ ] No SQL injection / XSS vulnerabilities

**Performance**:
- [ ] No N+1 queries
- [ ] Appropriate use of indexes
- [ ] Large lists paginated
- [ ] Expensive computations memoized

**Code Quality**:
- [ ] Code is readable and maintainable
- [ ] Functions are small and focused
- [ ] Naming is clear and consistent
- [ ] No unnecessary complexity
- [ ] DRY (Don't Repeat Yourself)

**Testing**:
- [ ] Tests are meaningful (not just for coverage)
- [ ] Tests test behavior, not implementation
- [ ] Critical paths covered

**Documentation**:
- [ ] Complex logic commented (WHY)
- [ ] API endpoints documented (OpenAPI)
- [ ] README updated if needed

---

## Summary

### Automated Enforcement

✅ **Prettier**: Code formatting (auto-fix on save)
✅ **ESLint**: Code quality rules (auto-fix where possible)
✅ **TypeScript**: Type safety (compile-time checks)
✅ **Husky + lint-staged**: Pre-commit hooks (lint + format before commit)
✅ **GitHub Actions**: CI checks (lint, type-check, test on PR)

### Manual Enforcement

🔍 **Code Review**: Security, performance, architecture decisions
🔍 **Testing**: Test quality, coverage, meaningful tests
🔍 **Documentation**: Comments, README, API docs

### Key Principles

1. **Consistency** - Code looks like it was written by one person
2. **Readability** - Code is easy to understand
3. **Type Safety** - TypeScript catches bugs at compile time
4. **Security** - Input validated, auth checked, secrets protected
5. **Performance** - Efficient queries, caching, optimization
6. **Testing** - Comprehensive tests for confidence
7. **Documentation** - Code is self-documenting, comments explain WHY

---

**Next Steps**:
1. Read this document
2. Set up pre-commit hooks: `pnpm prepare`
3. Configure VS Code with recommended settings
4. Review PRs using the checklist

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Review Date**: 2025-04-22 (3 months)
**Status**: Approved for Implementation
