# Advanced Search & Filters - Implementation Guide

**Feature:** Advanced Search & Filters
**Timeline:** 2 weeks (10 days)
**Priority:** HIGH (BMAD Feature #2)
**Status:** In Progress

---

## 🎯 Goals & Success Criteria

### **User Stories**
1. As a developer, I want to see only my tasks so I can focus on my work
2. As a PM, I want to filter high-priority bugs to triage them
3. As a team lead, I want to see all tasks due this week
4. As a user, I want to save my common filters as presets
5. As a user, I want to full-text search task titles and descriptions

### **Success Criteria**
- ✅ Search tasks by text (title, description, comments)
- ✅ Filter by: status, assignee, priority, labels, due date, project
- ✅ Combine multiple filters (AND logic)
- ✅ Save filter presets per user
- ✅ URL reflects current filters (shareable links)
- ✅ Fast performance (<100ms for 1000 tasks)
- ✅ Keyboard shortcuts (⌘K to open search)

---

## 🏗️ Architecture Overview

### **Components**

```
┌─────────────────────────────────────────────────┐
│            Frontend (React)                     │
├─────────────────────────────────────────────────┤
│  1. GlobalSearchBar (⌘K trigger)               │
│  2. FilterPanel (multi-criteria)                │
│  3. SavedFiltersList (presets)                  │
│  4. SearchResults (task list)                   │
└─────────────┬───────────────────────────────────┘
              │
              │ API Calls
              ▼
┌─────────────────────────────────────────────────┐
│         Backend API (Express)                   │
├─────────────────────────────────────────────────┤
│  GET /api/tasks/search                          │
│  POST /api/filters (save preset)                │
│  GET /api/filters (list presets)                │
│  DELETE /api/filters/:id                        │
└─────────────┬───────────────────────────────────┘
              │
              │ Query
              ▼
┌─────────────────────────────────────────────────┐
│       PostgreSQL (Database)                     │
├─────────────────────────────────────────────────┤
│  - Full-text search index (GIN)                 │
│  - Filter by columns (status, priority, etc)    │
│  - SavedFilter table                            │
└─────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Changes

### **1. Add Full-Text Search to Tasks**

```sql
-- Add search vector column
ALTER TABLE "Task" ADD COLUMN search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX task_search_idx ON "Task" USING GIN(search_vector);

-- Create trigger to auto-update search vector
CREATE FUNCTION task_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_search_update
  BEFORE INSERT OR UPDATE ON "Task"
  FOR EACH ROW EXECUTE FUNCTION task_search_trigger();

-- Update existing tasks
UPDATE "Task" SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B');
```

### **2. Create SavedFilter Table**

```prisma
// schema.prisma
model SavedFilter {
  id          String   @id @default(uuid())
  name        String
  userId      String
  workspaceId String?
  projectId   String?

  // Filter criteria (JSON)
  filters     Json     // { status: ['TODO'], assignee: ['userId'], ... }

  // Metadata
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  project     Project?   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([workspaceId])
}
```

---

## 🔌 Backend API

### **Search Endpoint**

```typescript
// GET /api/tasks/search
// Query params: q, status, assignee, priority, labels, dueDate, projectId

interface SearchParams {
  q?: string;              // Search query
  status?: string[];       // ['TODO', 'IN_PROGRESS']
  assignee?: string[];     // User IDs
  priority?: string[];     // ['HIGH', 'MEDIUM', 'LOW']
  labels?: string[];       // Label IDs
  dueDateFrom?: string;    // ISO date
  dueDateTo?: string;      // ISO date
  projectId?: string;      // Project ID
  workspaceId: string;     // Required
  sortBy?: string;         // 'relevance' | 'createdAt' | 'dueDate' | 'priority'
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export async function searchTasks(req: Request, res: Response) {
  const params: SearchParams = req.query;
  const userId = req.user!.id;

  // Build Prisma query
  const whereClause = {
    workspaceId: params.workspaceId,
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.status?.length && { status: { in: params.status } }),
    ...(params.assignee?.length && { assigneeId: { in: params.assignee } }),
    ...(params.priority?.length && { priority: { in: params.priority } }),
    ...(params.dueDateFrom && { dueDate: { gte: new Date(params.dueDateFrom) } }),
    ...(params.dueDateTo && { dueDate: { lte: new Date(params.dueDateTo) } }),
    // Full-text search
    ...(params.q && {
      search_vector: {
        search: params.q.split(' ').join(' & ')
      }
    })
  };

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, name: true } },
      labels: true,
    },
    orderBy: params.q
      ? { _relevance: { fields: ['title', 'description'], search: params.q } }
      : { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
    take: params.limit || 50,
    skip: params.offset || 0,
  });

  res.json({
    data: tasks,
    total: await prisma.task.count({ where: whereClause }),
  });
}
```

### **Saved Filters Endpoints**

```typescript
// POST /api/filters - Save a filter preset
export async function createSavedFilter(req: Request, res: Response) {
  const { name, filters, workspaceId, projectId, isDefault } = req.body;
  const userId = req.user!.id;

  const savedFilter = await prisma.savedFilter.create({
    data: {
      name,
      filters,
      userId,
      workspaceId,
      projectId,
      isDefault,
    },
  });

  res.status(201).json({ data: savedFilter });
}

// GET /api/filters - List saved filters
export async function listSavedFilters(req: Request, res: Response) {
  const userId = req.user!.id;
  const { workspaceId, projectId } = req.query;

  const filters = await prisma.savedFilter.findMany({
    where: {
      userId,
      ...(workspaceId && { workspaceId: workspaceId as string }),
      ...(projectId && { projectId: projectId as string }),
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: filters });
}

// DELETE /api/filters/:id - Delete saved filter
export async function deleteSavedFilter(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  await prisma.savedFilter.deleteMany({
    where: { id, userId }, // Only delete own filters
  });

  res.json({ message: 'Filter deleted' });
}
```

---

## 🎨 Frontend Components

### **1. GlobalSearchBar Component**

```tsx
// components/search/GlobalSearchBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GlobalSearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Keyboard shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Search className="h-4 w-4" />
        <span>Search tasks...</span>
        <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono text-gray-500 bg-gray-100 border rounded">
          <Command className="h-3 w-3 mr-1" />K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl mt-20 bg-white rounded-lg shadow-2xl">
            <form onSubmit={handleSearch} className="p-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, projects, or team members..."
                className="w-full text-lg border-none focus:ring-0 focus:outline-none"
                autoFocus
              />
            </form>
            {/* Quick search results preview here */}
          </div>
        </div>
      )}
    </>
  );
}
```

### **2. FilterPanel Component**

```tsx
// components/search/FilterPanel.tsx
'use client';

import { useState } from 'react';
import { Filter, X, Save } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onSave?: () => void;
}

interface FilterState {
  status?: string[];
  assignee?: string[];
  priority?: string[];
  labels?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
}

export function FilterPanel({ filters, onChange, onSave }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (key: keyof FilterState, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    onChange({ ...filters, [key]: updated });
  };

  const clearAllFilters = () => {
    onChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v =>
    Array.isArray(v) ? v.length > 0 : v !== undefined
  ).length;

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-10">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Filters</h3>
            <div className="flex gap-2">
              {onSave && (
                <button
                  onClick={onSave}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  <Save className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="space-y-2">
                {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(status => (
                  <label key={status} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(filters.status || []).includes(status)}
                      onChange={() => toggleFilter('status', status)}
                      className="rounded"
                    />
                    <span className="text-sm">{status.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <div className="space-y-2">
                {['HIGH', 'MEDIUM', 'LOW'].map(priority => (
                  <label key={priority} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(filters.priority || []).includes(priority)}
                      onChange={() => toggleFilter('priority', priority)}
                      className="rounded"
                    />
                    <span className="text-sm">{priority}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dueDateFrom || ''}
                  onChange={(e) => onChange({ ...filters, dueDateFrom: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.dueDateTo || ''}
                  onChange={(e) => onChange({ ...filters, dueDateTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Implementation Timeline

### **Week 1: Core Search Infrastructure**

**Day 1: Database Setup**
- [ ] Add search_vector column to Task table
- [ ] Create GIN index
- [ ] Create auto-update trigger
- [ ] Update existing tasks with search vectors
- [ ] Test full-text search queries

**Day 2: Backend API - Search Endpoint**
- [ ] Create search service
- [ ] Implement searchTasks endpoint
- [ ] Add filter logic (status, assignee, priority)
- [ ] Add full-text search integration
- [ ] Test with Postman/Thunder Client

**Day 3: Backend API - Saved Filters**
- [ ] Create SavedFilter model in Prisma
- [ ] Run migration
- [ ] Implement CRUD endpoints
- [ ] Add validation and permissions
- [ ] Test saved filters

**Day 4: Frontend - Search Bar Component**
- [ ] Create GlobalSearchBar component
- [ ] Add keyboard shortcut (⌘K)
- [ ] Implement search modal
- [ ] Add to top navigation
- [ ] Style and polish

**Day 5: Frontend - Filter Panel**
- [ ] Create FilterPanel component
- [ ] Implement multi-select filters
- [ ] Add date range picker
- [ ] Integrate with search results
- [ ] Test all filter combinations

### **Week 2: Advanced Features & Polish**

**Day 6: Search Results Page**
- [ ] Create dedicated search page
- [ ] Display filtered task list
- [ ] Add sorting options
- [ ] Implement pagination
- [ ] Add empty states

**Day 7: Saved Filters UI**
- [ ] Create SavedFiltersList component
- [ ] Add save filter dialog
- [ ] Implement load/delete filters
- [ ] Add default filter option
- [ ] Test persistence

**Day 8: URL-Based Filters**
- [ ] Implement URL param sync
- [ ] Add shareable filter links
- [ ] Handle deep linking
- [ ] Test browser back/forward
- [ ] Add copy link button

**Day 9: Performance & Testing**
- [ ] Optimize search queries
- [ ] Add query result caching
- [ ] Test with large datasets (1000+ tasks)
- [ ] Fix any performance issues
- [ ] Add loading states

**Day 10: Polish & Documentation**
- [ ] Add keyboard shortcuts guide
- [ ] Write user documentation
- [ ] Final UI polish
- [ ] Test all edge cases
- [ ] Create demo video

---

## 🧪 Testing Checklist

### **Backend Tests**
- [ ] Full-text search returns relevant results
- [ ] Filters work correctly (status, priority, assignee)
- [ ] Combining multiple filters works (AND logic)
- [ ] Saved filters CRUD operations work
- [ ] Permission checks prevent unauthorized access
- [ ] Performance is <100ms for typical queries

### **Frontend Tests**
- [ ] Search bar opens with ⌘K
- [ ] Search modal works on all pages
- [ ] Filter panel UI is intuitive
- [ ] Saved filters persist across sessions
- [ ] URL parameters sync correctly
- [ ] Mobile responsive
- [ ] Keyboard navigation works

---

## 📊 Performance Targets

- **Search Query:** <100ms for 1000 tasks
- **Filter Application:** <50ms
- **Page Load:** <500ms
- **Index Size:** <10% of table size

---

## 🚀 Future Enhancements

After initial implementation:
- [ ] Search in comments
- [ ] Advanced query syntax (OR, NOT operators)
- [ ] Search history
- [ ] Suggested searches
- [ ] Search analytics
- [ ] Global search across workspaces
- [ ] AI-powered search suggestions

---

**Status:** Ready to implement
**Next Step:** Set up PostgreSQL full-text search
