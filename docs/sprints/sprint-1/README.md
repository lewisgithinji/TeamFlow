# Sprint 1: MVP Foundation

**Sprint Goal**: Establish foundation - User authentication, workspace/project creation, and basic task management

**Duration**: 2 weeks (10 working days)
**Story Points**: 33 / 40 capacity
**Team**: 3 Full-Stack Developers

---

## 📋 Quick Links

- **[Sprint Planning](planning.md)** - Detailed sprint plan with all tasks
- **[Task Board](task-board.md)** - Task tracking and daily progress
- **[Sprint Overview](../SPRINT_OVERVIEW.md)** - Overall sprint management

---

## 🎯 Sprint Goal

By the end of Sprint 1, users should be able to:
1. ✅ Register and log into TeamFlow
2. ✅ Reset their password if forgotten
3. ✅ Create a workspace for their team
4. ✅ Create a project within that workspace
5. ✅ Create and view tasks on a Kanban board

---

## 📊 User Stories (7 stories, 33 points)

| # | User Story | Points | Status |
|---|------------|--------|--------|
| 1.1 | User Registration | 5 | 🟡 Planned |
| 1.2 | User Login | 3 | 🟡 Planned |
| 1.3 | Password Reset | 3 | 🟡 Planned |
| 2.1 | Create Workspace | 3 | 🟡 Planned |
| 2.4 | Create Project | 3 | 🟡 Planned |
| 3.1 | Create & Edit Tasks | 8 | 🟡 Planned |
| 3.2 | Kanban Board View | 8 | 🟡 Planned |

---

## 🗓️ Sprint Schedule

### Week 1
- **Day 1**: Database schemas (all models)
- **Day 2**: Authentication backend
- **Day 3**: Authentication frontend + middleware
- **Day 4**: Password reset + Workspaces backend
- **Day 5**: Workspaces frontend + Projects backend + **Mid-Sprint Review**

### Week 2
- **Day 6**: Projects frontend + Tasks backend
- **Day 7**: Tasks CRUD completion
- **Day 8**: Tasks frontend + WebSocket
- **Day 9**: Kanban board completion
- **Day 10**: Testing, bug fixes, **Sprint Review & Retrospective**

---

## 🔑 Key Features Delivered

### Authentication System
- Email/password registration
- Email verification
- Login with JWT tokens (15 min access, 7 day refresh)
- Password reset flow
- Secure password hashing (bcrypt)

### Workspace Management
- Create workspaces
- Workspace switcher
- Owner role assignment
- Multiple workspaces per user

### Project Management
- Create projects in workspaces
- Project list view
- Link projects to workspaces

### Task Management
- Create tasks with rich fields (title, description, assignees, priority, due date, story points, labels)
- Edit tasks inline
- Delete tasks
- Task detail view
- Labels/tags system
- Auto-save

### Kanban Board
- 3-column board (Todo, In Progress, Done)
- Drag-and-drop tasks between columns
- Task status auto-updates
- Real-time updates (WebSocket)
- Conflict resolution (optimistic locking)
- Task cards with compact info

---

## ✅ Success Criteria

Sprint 1 is successful if:
- [x] All 7 user stories completed (33 points)
- [x] All acceptance criteria met
- [x] Tests passing (>70% coverage)
- [x] Code reviewed and merged
- [x] Deployed to staging
- [x] Demo ready

---

## 📈 Metrics

**Planned**:
- Story Points: 33
- Tasks: 70+
- Hours: 184

**Actual** (to be filled after sprint):
- Story Points Completed: TBD
- Velocity: TBD%
- Bugs: TBD
- Test Coverage: TBD%

---

## 🚀 Getting Started

### For Developers

1. Read [planning.md](planning.md) - Understand all tasks
2. Check [task-board.md](task-board.md) - See your Day 1 tasks
3. Set up local environment (if not done)
4. Join Sprint Planning meeting
5. Start with database schemas on Day 1

### Prerequisites

- [x] Monorepo structure ready
- [x] Local environment set up (Docker, pnpm, Node.js)
- [x] Environment variables configured
- [x] Git hooks working
- [x] Documentation reviewed

---

## 📚 Resources

- [PRD User Stories](../../brainstorm/03-prd.md)
- [Data Models](../../model/data-models.md)
- [API Contracts](../../model/api-contracts.md)
- [Coding Standards](../../architecture/05-coding-standards.md)

---

**Sprint Status**: 🟡 Planned (Not Started)
**Next Review**: Mid-Sprint on Day 5
**Sprint End**: Day 10

Let's build something amazing! 🚀
