# Sprint 1 Task Board

**Sprint Goal**: Establish foundation: User authentication, workspace/project creation, and basic task management

---

## 🗂️ Task Columns

### 🟡 Backlog (33 story points)
All tasks ready to be worked on

### 🔵 In Progress (0 tasks)
Currently being worked on (WIP limit: 6 tasks max)

### 🟢 Done (0 tasks)
Completed, reviewed, and merged

### 🔴 Blocked (0 tasks)
Waiting for dependency or external factor

---

## 📊 Sprint Burndown

| Day | Planned Remaining | Actual Remaining | Notes |
|-----|-------------------|------------------|-------|
| 0 | 33 | 33 | Sprint start |
| 1 | 29 | - | Database schemas |
| 2 | 23 | - | Auth backend |
| 3 | 17 | - | Auth frontend |
| 4 | 12 | - | Password reset + Workspaces |
| 5 | 8 | - | **Mid-sprint review** |
| 6 | 6 | - | Projects + Tasks backend |
| 7 | 4 | - | Tasks CRUD |
| 8 | 2 | - | WebSocket + Kanban |
| 9 | 0 | - | Kanban completion |
| 10 | 0 | - | Testing + Demo |

---

## 📝 Task List by User Story

### User Story 1.1: User Registration (5 points)

#### Backend (14 hours)
- [ ] 1.1.1: User schema (2h) - Day 1
- [ ] 1.1.2: Password hashing (2h) - Day 2
- [ ] 1.1.3: Register API (3h) - Day 2
- [ ] 1.1.4: Token generation (2h) - Day 2
- [ ] 1.1.5: Send email (2h) - Day 2
- [ ] 1.1.6: Verify email API (3h) - Day 2

#### Frontend (8 hours)
- [ ] 1.1.7: Registration form (3h) - Day 3
- [ ] 1.1.8: Form validation (2h) - Day 3
- [ ] 1.1.9: Connect to API (2h) - Day 3

#### Testing (3 hours)
- [ ] 1.1.10: Unit tests (2h) - Day 4
- [ ] 1.1.11: Integration tests (1h) - Day 4

---

### User Story 1.2: User Login (3 points)

#### Backend (9 hours)
- [ ] 1.2.1: Login API (3h) - Day 2
- [ ] 1.2.2: JWT utils (2h) - Day 2
- [ ] 1.2.3: Refresh token (2h) - Day 3
- [ ] 1.2.4: Auth middleware (2h) - Day 3

#### Frontend (4 hours)
- [ ] 1.2.5: Login form (2h) - Day 3
- [ ] 1.2.6: Connect to API (2h) - Day 3

#### Testing (2 hours)
- [ ] 1.2.7: JWT unit tests (1h) - Day 3
- [ ] 1.2.8: Login integration tests (1h) - Day 4

---

### User Story 1.3: Password Reset (3 points)

#### Backend (9 hours)
- [ ] 1.3.1: Request reset API (2h) - Day 4
- [ ] 1.3.2: Validate token (2h) - Day 4
- [ ] 1.3.3: Reset password API (3h) - Day 4
- [ ] 1.3.4: Email template (2h) - Day 4

#### Frontend (5 hours)
- [ ] 1.3.5: Forgot password form (2h) - Day 5
- [ ] 1.3.6: Reset password form (2h) - Day 5
- [ ] 1.3.7: Connect to API (1h) - Day 5

#### Testing (1 hour)
- [ ] 1.3.8: Integration tests (1h) - Day 5

---

### User Story 2.1: Create Workspace (3 points)

#### Backend (8 hours)
- [ ] 2.1.1: Workspace schema (2h) - Day 1
- [ ] 2.1.2: Create workspace API (3h) - Day 4
- [ ] 2.1.3: List workspaces (2h) - Day 4
- [ ] 2.1.4: Get workspace (1h) - Day 4

#### Frontend (6 hours)
- [ ] 2.1.5: Create workspace form (2h) - Day 5
- [ ] 2.1.6: Workspace switcher (2h) - Day 5
- [ ] 2.1.7: Connect to API (2h) - Day 5

#### Testing (1 hour)
- [ ] 2.1.8: Integration tests (1h) - Day 5

---

### User Story 2.4: Create Project (3 points)

#### Backend (8 hours)
- [ ] 2.4.1: Project schema (2h) - Day 1
- [ ] 2.4.2: Create project API (3h) - Day 5
- [ ] 2.4.3: List projects (2h) - Day 5
- [ ] 2.4.4: Get project (1h) - Day 5

#### Frontend (6 hours)
- [ ] 2.4.5: Create project form (2h) - Day 6
- [ ] 2.4.6: Project list (2h) - Day 6
- [ ] 2.4.7: Connect to API (2h) - Day 6

#### Testing (1 hour)
- [ ] 2.4.8: Integration tests (1h) - Day 6

---

### User Story 3.1: Create & Edit Tasks (8 points)

#### Backend (20 hours)
- [ ] 3.1.1: Task schema (3h) - Day 1
- [ ] 3.1.2: Create task API (4h) - Day 6
- [ ] 3.1.3: Update task API (4h) - Day 6-7
- [ ] 3.1.4: List tasks API (3h) - Day 6
- [ ] 3.1.5: Get task API (2h) - Day 6
- [ ] 3.1.6: Delete task API (2h) - Day 7
- [ ] 3.1.7: Labels CRUD (2h) - Day 7

#### Frontend (16 hours)
- [ ] 3.1.8: Create task form (4h) - Day 7
- [ ] 3.1.9: Task detail view (4h) - Day 7
- [ ] 3.1.10: Assignee picker (2h) - Day 7
- [ ] 3.1.11: Label picker (2h) - Day 7
- [ ] 3.1.12: Connect to API (3h) - Day 8
- [ ] 3.1.13: Auto-save (1h) - Day 8

#### Testing (4 hours)
- [ ] 3.1.14: Unit tests (2h) - Day 8
- [ ] 3.1.15: Integration tests (2h) - Day 8

---

### User Story 3.2: Kanban Board View (8 points)

#### Backend (16 hours)
- [ ] 3.2.1: Update position API (3h) - Day 7
- [ ] 3.2.2: Batch update (3h) - Day 7
- [ ] 3.2.3: WebSocket setup (6h) - Day 8
- [ ] 3.2.4: Optimistic locking (4h) - Day 8

#### Frontend (20 hours)
- [ ] 3.2.5: Kanban board layout (4h) - Day 8
- [ ] 3.2.6: Task card component (3h) - Day 8
- [ ] 3.2.7: Drag-and-drop (5h) - Day 9
- [ ] 3.2.8: Connect to API (3h) - Day 9
- [ ] 3.2.9: Real-time updates (3h) - Day 9
- [ ] 3.2.10: Conflict resolution (2h) - Day 9

#### Testing (4 hours)
- [ ] 3.2.11: Unit tests (2h) - Day 9
- [ ] 3.2.12: E2E tests (2h) - Day 10

---

## 🏃 Daily Capacity

**3 developers × 8 hours/day = 24 hours/day**

| Day | Planned Hours | Backend | Frontend | Full-Stack |
|-----|---------------|---------|----------|------------|
| 1 | 9 | 9 (schemas) | 0 | 0 |
| 2 | 17 | 17 (auth) | 0 | 0 |
| 3 | 16 | 4 (auth) | 12 (auth UI) | 0 |
| 4 | 20 | 14 (reset + WS) | 6 (reset UI) | 0 |
| 5 | 24 | 8 (projects) | 16 (WS + projects) | 0 |
| 6 | 24 | 15 (tasks) | 9 (projects) | 0 |
| 7 | 24 | 10 (tasks + pos) | 14 (tasks UI) | 0 |
| 8 | 24 | 10 (WS + lock) | 14 (tasks + board) | 0 |
| 9 | 20 | 0 | 20 (board DnD) | 0 |
| 10 | 6 | 2 (tests) | 2 (tests) | 2 (E2E) |

**Total**: 184 hours planned (~61 hours per developer)

---

## 🎯 Task Assignment Template

### Backend Developer
**Day 1**: Tasks 1.1.1, 2.1.1, 2.4.1, 3.1.1 (9h)
**Day 2**: Tasks 1.1.2, 1.1.3, 1.1.4, 1.1.5, 1.1.6, 1.2.1, 1.2.2 (17h)
**Day 3**: Tasks 1.2.3, 1.2.4 (4h)
**Day 4**: Tasks 1.3.1, 1.3.2, 1.3.3, 1.3.4, 2.1.2, 2.1.3, 2.1.4, Tests (14h)
...

### Frontend Developer
**Day 1**: Setup, review docs (8h)
**Day 2**: Review backend progress, plan UI (8h)
**Day 3**: Tasks 1.1.7, 1.1.8, 1.1.9, 1.2.5, 1.2.6 (12h)
**Day 4**: Tests, prep for Day 5 (6h)
**Day 5**: Tasks 1.3.5, 1.3.6, 1.3.7, 2.1.5, 2.1.6, 2.1.7 (16h)
...

### Full-Stack Developer
**Day 1-9**: Support backend and frontend as needed
**Day 10**: E2E testing, bug fixes, deployment

---

## 📈 Progress Tracking

Update this section daily in standup:

### Day 1 Progress
**Completed**: 0 points
**Remaining**: 33 points
**Velocity**: 0%
**Notes**: Sprint started

### Day 2 Progress
**Completed**: TBD
**Remaining**: TBD
**Velocity**: TBD
**Notes**: TBD

---

## 🚨 Blockers Log

| Date | Task ID | Blocker | Owner | Resolution | Status |
|------|---------|---------|-------|------------|--------|
| - | - | - | - | - | - |

---

**Last Updated**: Sprint Start
**Next Update**: Daily Standup
