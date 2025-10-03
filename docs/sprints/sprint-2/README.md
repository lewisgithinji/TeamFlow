# Sprint 2: Team Collaboration

**Status**: 🟡 Planned (Not Started)
**Duration**: 2 weeks (10 working days)
**Goal**: Enable team collaboration through workspace invitations, member management, task comments, real-time updates, and activity tracking.

---

## 🎯 Sprint Goal

By the end of Sprint 2, users should be able to:
1. ✅ Invite team members to workspaces via email
2. ✅ Manage team member roles and permissions (Owner, Admin, Member, Viewer)
3. ✅ Comment on tasks with markdown support and @mentions
4. ✅ See real-time updates when team members make changes
5. ✅ Go through interactive onboarding (first-time users)
6. ✅ View activity feed for workspace/project changes
7. ✅ Receive in-app and email notifications for important events

---

## 📊 Sprint Metrics

**Story Points**: 38 / 40 capacity
**User Stories**: 7 total
**Tasks**: 67 total
**Estimated Hours**: ~150 hours

### Story Breakdown
| User Story | Priority | Points | Tasks | Status |
|------------|----------|--------|-------|--------|
| 2.2: Invite Team Members | P0 | 5 | 10 | Not Started |
| 2.3: Manage Team Members | P0 | 5 | 6 | Not Started |
| 3.2: Task Comments | P1 | 5 | 6 | Not Started |
| 3.3: Real-time Collaboration | P1 | 8 | 8 | Not Started |
| 1.4: User Onboarding | P1 | 5 | 4 | Not Started |
| 3.4: Activity Feed | P1 | 5 | 4 | Not Started |
| 3.5: Notifications | P1 | 5 | 6 | Not Started |

---

## 🚀 Key Features

### 1. Workspace Invitations
- Send email invitations to team members
- Bulk invite (multiple emails at once)
- Set role when inviting (Admin, Member, Viewer)
- Accept/decline invitation flow
- Manage pending invitations
- 7-day expiration on invitations

### 2. Member Management
- View all workspace members
- Change member roles
- Remove members from workspace
- Role-based permissions enforcement
- Cannot remove workspace owner

### 3. Task Comments
- Add comments to tasks
- Markdown formatting support
- @mention team members
- Edit comments (within 15 minutes)
- Delete own comments
- Real-time comment updates

### 4. Real-time Collaboration
- WebSocket connections for live updates
- Task board updates in real-time
- Comment updates in real-time
- User presence indicators
- Typing indicators for comments
- Optimistic UI updates
- Conflict resolution for simultaneous edits

### 5. User Onboarding
- Interactive 5-step tutorial
- Create workspace, project, task
- Kanban board demo
- Invite members demo
- Skip or replay tutorial
- Demo data for exploration

### 6. Activity Feed
- View recent workspace/project activity
- Activity types: tasks, comments, members, projects
- Filter by type, user, date
- Real-time activity updates
- Grouped by day

### 7. Notifications
- In-app notification center
- Unread count badge
- Notification types: task assigned, due soon, @mention, comments, invites
- Mark as read/unread
- Notification preferences
- Optional email notifications

---

## 🛠️ Technical Implementation

### Backend (Express/Node.js)
- **Invitation Service**: Create, validate, accept invitations
- **Member Management Service**: List, update, remove members
- **Permission Middleware**: Role-based access control
- **Comment Service**: CRUD operations, @mention parsing
- **WebSocket Server**: Socket.io with Redis pub/sub
- **Notification Service**: Create, list, mark as read notifications
- **Activity Feed Service**: Query and format activity logs

### Frontend (Next.js/React)
- **Invitation UI**: Invite modal, pending list, accept/decline page
- **Member Management UI**: Members list, role selector, confirmation dialogs
- **Comment UI**: Comment list, markdown editor, @mention autocomplete
- **WebSocket Client**: Real-time event handling, presence tracking
- **Onboarding UI**: Interactive tutorial with progress indicator
- **Activity Feed UI**: Activity list with filters, real-time updates
- **Notification Center**: Bell icon, dropdown, preferences

### Infrastructure
- **Socket.io**: WebSocket server
- **Redis**: Pub/sub for multi-server WebSocket support
- **Email Service**: Resend or SendGrid for invitation/notification emails

---

## 📋 Documentation

- **[Planning Document](planning.md)** - Detailed sprint plan with all tasks
- **[Task Board](task-board.md)** - Task tracking and progress
- **Sprint Review Notes** - (Created at end of sprint)
- **Sprint Retrospective** - (Created at end of sprint)

---

## 🗓️ Sprint Schedule

### Week 1: Invitations & Member Management
**Days 1-2**: Invitation system (backend + frontend)
**Day 3**: Accept/decline flow + Member management service
**Days 4-5**: Permission middleware + Comment system

### Week 2: Real-time & Notifications
**Days 6-7**: WebSocket setup + Real-time events
**Day 8**: Real-time UI + Notifications backend
**Days 9-10**: Activity feed + Onboarding + Polish

---

## ✅ Definition of Done

A user story is "Done" when:
1. All acceptance criteria met
2. All tasks completed
3. Unit tests written and passing (80%+ coverage)
4. Integration tests passing
5. E2E tests passing
6. Code reviewed and approved
7. Merged to main branch
8. Deployed to staging
9. Manually tested
10. Documentation updated

---

## 📦 Dependencies

### External Services
- **Email Service**: Resend or SendGrid (API key required)
- **Redis**: For WebSocket pub/sub (Docker or cloud instance)

### Sprint 1 Prerequisites
All Sprint 1 features must be completed:
- ✅ User authentication (JWT)
- ✅ Workspace CRUD
- ✅ Project CRUD
- ✅ Task CRUD
- ✅ Kanban board view
- ✅ Database models (User, Workspace, Project, Task, Comment, Activity, Invitation)

---

## 🎯 Success Criteria

### Velocity
- **Target**: 35-40 story points completed
- **Minimum Acceptable**: 30 story points (78%)

### Quality
- **Test Coverage**: >80%
- **Bug Count**: <10 bugs in sprint
- **Code Review Cycle**: <6 hours average

### Performance
- **Invitation email delivery**: <30 seconds
- **Real-time update latency**: <500ms
- **Notification creation**: <100ms
- **WebSocket connection success**: >95%

---

## ⚠️ Risks & Mitigation

### 1. WebSocket Complexity
**Risk**: Real-time features are complex and may cause delays
**Mitigation**:
- Start WebSocket setup early (Day 6)
- Implement polling fallback
- Test with multiple clients
- Keep event payloads simple

### 2. Email Deliverability
**Risk**: Invitation emails may not be delivered
**Mitigation**:
- Use reliable email service (Resend/SendGrid)
- Implement retry logic
- Monitor delivery rates
- Test spam filters

### 3. Permission System Bugs
**Risk**: Permission system has many edge cases
**Mitigation**:
- Define clear permission matrix
- Write comprehensive tests
- Review permission logic carefully
- Test edge cases (owner removal, etc.)

### 4. Real-time UI Conflicts
**Risk**: Simultaneous edits may cause data conflicts
**Mitigation**:
- Implement optimistic UI carefully
- Add "Someone else updated this" warnings
- Provide manual refresh option
- Test simultaneous edits

---

## 📚 Resources

### Related Documentation
- [Product Requirements Document](../../brainstorm/03-prd.md)
- [Data Models](../../model/data-models.md)
- [API Contracts](../../model/api-contracts.md)
- [System Design](../../architecture/01-system-design.md)

### Technical Guides
- [Socket.io Documentation](https://socket.io/docs/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [React Markdown](https://github.com/remarkjs/react-markdown)

---

## 🏆 Expected Outcomes

By the end of Sprint 2, TeamFlow will have:

1. **Full team collaboration** - Invite, manage members with roles
2. **Active discussions** - Comment on tasks with markdown and @mentions
3. **Real-time updates** - See changes instantly without page refresh
4. **User engagement** - Guided onboarding for new users
5. **Activity visibility** - Track all workspace/project changes
6. **Notification system** - Stay informed about important events

This transforms TeamFlow from a personal task manager into a **collaborative team platform**.

---

## 📞 Quick Links

- [Sprint 2 Planning](planning.md) - Detailed task breakdown
- [Sprint 2 Task Board](task-board.md) - Track daily progress
- [Sprint Overview](../SPRINT_OVERVIEW.md) - All sprints roadmap
- [Sprint 1 Retrospective](../sprint-1/retrospective.md) - Lessons learned

---

**Sprint Start Date**: TBD
**Sprint End Date**: TBD
**Sprint Review**: TBD
**Sprint Retrospective**: TBD

**Status**: Ready to start after Sprint 1 completion
