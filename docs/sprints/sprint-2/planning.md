# Sprint 2: Team Collaboration - Planning Document

**Sprint Goal**: Enable team collaboration through workspace invitations, member management, task comments, real-time updates, and activity tracking.

**Duration**: 2 weeks (10 working days)
**Team**: 3 Full-Stack Developers
**Total Story Points**: 38 points
**Velocity Target**: 35-40 points

---

## Sprint Objectives

By the end of Sprint 2, users should be able to:
1. ✅ Invite team members to workspaces via email
2. ✅ Manage team member roles and permissions
3. ✅ Comment on tasks for discussions
4. ✅ See real-time updates when team members make changes
5. ✅ Go through interactive onboarding (first-time users)
6. ✅ View activity feed for workspace/project changes
7. ✅ Receive notifications for important events

---

## User Stories

### User Story 2.2: Invite Team Members
**Priority**: P0 (Must-Have)
**Story Points**: 5
**Dependencies**: Sprint 1 (User authentication, Workspaces)

**As a** workspace owner
**I want to** invite team members via email
**So that** they can collaborate on projects

**Acceptance Criteria**:
- [ ] Owner/Admin can send email invitations
- [ ] Invitation email contains signup/login link
- [ ] Invited user with existing account auto-added to workspace
- [ ] Invited user without account prompted to register
- [ ] Invitation expires after 7 days
- [ ] Inviter can set role (Admin, Member, Viewer)
- [ ] Pending invitations visible in workspace settings
- [ ] Inviter can revoke pending invitations
- [ ] Invited user can accept or decline invitation
- [ ] Bulk invite (paste multiple emails)

---

### User Story 2.3: Manage Team Members
**Priority**: P0 (Must-Have)
**Story Points**: 5
**Dependencies**: User Story 2.2

**As a** workspace owner
**I want to** manage team member roles and access
**So that** I can control permissions

**Acceptance Criteria**:
- [ ] Owner can view all team members in workspace
- [ ] Owner can change member roles (Admin, Member, Viewer)
- [ ] Owner can remove members from workspace
- [ ] Removed member loses access immediately
- [ ] Admin can invite and remove members (not other admins)
- [ ] Member can view projects they're assigned to
- [ ] Viewer can view but not edit anything
- [ ] Role changes take effect immediately
- [ ] Confirmation required for removing members
- [ ] Cannot remove workspace owner

**Role Permissions**:
| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| Create projects | ✓ | ✓ | ✓ | ✗ |
| Delete projects | ✓ | ✓ | Own only | ✗ |
| Invite members | ✓ | ✓ | ✗ | ✗ |
| Remove members | ✓ | ✓ | ✗ | ✗ |
| Change settings | ✓ | ✗ | ✗ | ✗ |
| Create tasks | ✓ | ✓ | ✓ | ✗ |
| Edit tasks | ✓ | ✓ | Assigned | ✗ |
| Delete tasks | ✓ | ✓ | Own only | ✗ |

---

### User Story 3.2: Task Comments
**Priority**: P1 (Should-Have)
**Story Points**: 5
**Dependencies**: Sprint 1 (Tasks)

**As a** team member
**I want to** comment on tasks
**So that** I can discuss work with my team

**Acceptance Criteria**:
- [ ] User can add comments to tasks
- [ ] Comments support markdown formatting
- [ ] Comments show author, avatar, timestamp
- [ ] Comments display in chronological order
- [ ] User can edit own comments (within 15 minutes)
- [ ] User can delete own comments
- [ ] Comment count visible on task card
- [ ] Real-time comment updates
- [ ] @mention team members in comments
- [ ] @mentioned users get notifications
- [ ] Comments visible in activity feed

---

### User Story 3.3: Real-time Collaboration
**Priority**: P1 (Should-Have)
**Story Points**: 8
**Dependencies**: Sprint 1 (All core features)

**As a** team member
**I want to** see real-time updates when others make changes
**So that** I always have the latest information

**Acceptance Criteria**:
- [ ] Task updates appear in real-time (no page refresh)
- [ ] Task board updates when tasks move
- [ ] New comments appear instantly
- [ ] User presence indicators ("John is viewing this task")
- [ ] Typing indicators for comments
- [ ] Optimistic UI updates
- [ ] Conflict resolution for simultaneous edits
- [ ] "Someone else updated this" warning
- [ ] WebSocket connection with auto-reconnect
- [ ] Graceful degradation if WebSocket fails (polling fallback)

**Technical Notes**:
- Use Socket.io for WebSocket connections
- Implement Redis pub/sub for multi-server support
- Room-based events (workspace, project, task levels)

---

### User Story 1.4: User Onboarding
**Priority**: P1 (Should-Have)
**Story Points**: 5
**Dependencies**: Sprint 1 (Workspaces, Projects, Tasks)

**As a** new user
**I want to** go through an interactive onboarding
**So that** I understand how to use TeamFlow

**Acceptance Criteria**:
- [ ] Interactive tutorial on first login
- [ ] Step 1: Create your first workspace
- [ ] Step 2: Create your first project
- [ ] Step 3: Create your first task
- [ ] Step 4: Try moving tasks on Kanban board
- [ ] Step 5: Invite team members
- [ ] User can skip onboarding
- [ ] User can replay tutorial from settings
- [ ] Demo data pre-loaded for exploration
- [ ] Progress indicator shows steps (1/5, 2/5, etc.)
- [ ] "Next" and "Back" buttons for navigation
- [ ] Onboarding completion tracked in database

---

### User Story 3.4: Activity Feed
**Priority**: P1 (Should-Have)
**Story Points**: 5
**Dependencies**: Sprint 1 (Activity model)

**As a** team member
**I want to** see an activity feed of workspace/project changes
**So that** I can stay informed about what's happening

**Acceptance Criteria**:
- [ ] Activity feed shows recent changes (last 7 days)
- [ ] Activity types: task created, updated, completed, commented
- [ ] Activity types: member invited, joined, left
- [ ] Activity types: project created, archived
- [ ] Each activity shows actor, action, target, timestamp
- [ ] Activities grouped by day
- [ ] Filter by activity type
- [ ] Filter by user
- [ ] Filter by project
- [ ] Load more (pagination)
- [ ] Real-time activity updates
- [ ] Activity feed at workspace and project levels

**Activity Display Format**:
```
John Doe created task "Fix login bug" in Website Redesign — 2 hours ago
Jane Smith completed task "Design homepage" — 4 hours ago
Mike Johnson commented on "API Integration" — Yesterday at 3:45 PM
```

---

### User Story 3.5: Notifications
**Priority**: P1 (Should-Have)
**Story Points**: 5
**Dependencies**: Sprint 1 (Tasks, Comments)

**As a** team member
**I want to** receive notifications for important events
**So that** I don't miss updates that need my attention

**Acceptance Criteria**:
- [ ] In-app notification center (bell icon)
- [ ] Unread notification count badge
- [ ] Notification for task assigned to me
- [ ] Notification for task due soon (1 day before)
- [ ] Notification when @mentioned in comment
- [ ] Notification when someone comments on my task
- [ ] Notification for workspace invitation
- [ ] Mark individual notification as read
- [ ] Mark all notifications as read
- [ ] Notification preferences (enable/disable per type)
- [ ] Email notifications (optional, configurable)
- [ ] Notification includes link to relevant task/comment
- [ ] Notifications auto-mark as read when viewing item
- [ ] Show last 30 days of notifications

**Notification Types**:
| Type | In-App | Email (Default) |
|------|--------|-----------------|
| Task assigned | ✓ | ✓ |
| Task due soon | ✓ | ✓ |
| @mentioned | ✓ | ✓ |
| Comment on my task | ✓ | ✗ |
| Workspace invite | ✓ | ✓ |
| Task completed | ✓ | ✗ |

---

## Task Breakdown

### Task 2.2.1: Database Schema for Invitations
**Story**: User Story 2.2
**Estimate**: 2 hours
**Priority**: High
**Dependencies**: None

**Description**:
Verify and update the Invitation model in Prisma schema.

**Acceptance Criteria**:
- [ ] Invitation model includes: email, workspaceId, inviterId, role, token, expiresAt
- [ ] Unique token generated for each invitation
- [ ] Index on token for fast lookup
- [ ] Index on workspaceId for listing invitations
- [ ] Cascade delete when workspace is deleted

**Implementation Notes**:
```prisma
model Invitation {
  id          String   @id @default(cuid())
  email       String
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  inviterId   String
  inviter     User     @relation(fields: [inviterId], references: [id])
  role        Role     @default(MEMBER)
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([workspaceId])
  @@index([email])
}
```

---

### Task 2.2.2: Invitation Service (Backend)
**Story**: User Story 2.2
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Task 2.2.1

**Description**:
Create invitation service for creating, validating, and managing invitations.

**Acceptance Criteria**:
- [ ] `createInvitation(email, workspaceId, inviterId, role)` method
- [ ] `validateInvitation(token)` method
- [ ] `acceptInvitation(token, userId)` method
- [ ] `revokeInvitation(invitationId)` method
- [ ] `listPendingInvitations(workspaceId)` method
- [ ] Generate unique token (crypto.randomBytes)
- [ ] Set expiration to 7 days from creation
- [ ] Check if user already member of workspace
- [ ] Handle expired invitations gracefully

---

### Task 2.2.3: Invitation API Endpoints
**Story**: User Story 2.2
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Task 2.2.2

**Description**:
Create REST API endpoints for invitation management.

**Endpoints**:
- [ ] `POST /api/v1/workspaces/:workspaceId/invitations` - Create invitation
- [ ] `POST /api/v1/workspaces/:workspaceId/invitations/bulk` - Bulk invite
- [ ] `GET /api/v1/workspaces/:workspaceId/invitations` - List pending invitations
- [ ] `POST /api/v1/invitations/:token/accept` - Accept invitation
- [ ] `POST /api/v1/invitations/:token/decline` - Decline invitation
- [ ] `DELETE /api/v1/invitations/:invitationId` - Revoke invitation

**Validation**:
- [ ] Email format validation
- [ ] Role validation (ADMIN, MEMBER, VIEWER)
- [ ] Permission check (only Owner/Admin can invite)
- [ ] Workspace exists validation

---

### Task 2.2.4: Email Template for Invitations
**Story**: User Story 2.2
**Estimate**: 2 hours
**Priority**: High
**Dependencies**: Task 2.2.2

**Description**:
Create HTML email template for workspace invitations.

**Acceptance Criteria**:
- [ ] Email includes inviter name and workspace name
- [ ] Email includes role user will have
- [ ] Email includes CTA button "Accept Invitation"
- [ ] Email includes link to decline invitation
- [ ] Email includes expiration date/time
- [ ] Responsive design (mobile-friendly)
- [ ] Plain text fallback for email clients
- [ ] TeamFlow branding (logo, colors)

**Template Variables**:
- `inviterName`
- `inviterEmail`
- `workspaceName`
- `role`
- `acceptLink`
- `declineLink`
- `expiresAt`

---

### Task 2.2.5: Send Invitation Email
**Story**: User Story 2.2
**Estimate**: 2 hours
**Priority**: High
**Dependencies**: Task 2.2.4

**Description**:
Integrate email service to send invitation emails.

**Acceptance Criteria**:
- [ ] Use Resend or SendGrid for email delivery
- [ ] Email sent asynchronously (job queue)
- [ ] Retry logic for failed emails (3 attempts)
- [ ] Track email delivery status
- [ ] Log email events (sent, delivered, failed)
- [ ] Rate limiting (max 50 invites per workspace per hour)

---

### Task 2.2.6: Invitation UI - Invite Modal
**Story**: User Story 2.2
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Task 2.2.3

**Description**:
Create UI for inviting team members.

**Acceptance Criteria**:
- [ ] "Invite Members" button in workspace settings
- [ ] Modal with email input field
- [ ] Role dropdown (Admin, Member, Viewer)
- [ ] Bulk invite textarea (multiple emails, comma/newline separated)
- [ ] Validation messages for invalid emails
- [ ] Loading state while sending invitations
- [ ] Success message with count of sent invitations
- [ ] Error handling for failed invitations

**UI Components**:
- `InviteMemberModal.tsx`
- `RoleSelector.tsx`
- `EmailInput.tsx` (with validation)

---

### Task 2.2.7: Invitation UI - Pending Invitations List
**Story**: User Story 2.2
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 2.2.6

**Description**:
Display list of pending invitations in workspace settings.

**Acceptance Criteria**:
- [ ] Table showing pending invitations
- [ ] Columns: Email, Role, Invited By, Sent Date, Actions
- [ ] "Revoke" button for each invitation
- [ ] Confirmation dialog before revoking
- [ ] Empty state when no pending invitations
- [ ] Filter by role (All, Admin, Member, Viewer)
- [ ] Invitation status badge (Pending, Expired)

---

### Task 2.2.8: Accept/Decline Invitation Page
**Story**: User Story 2.2
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Task 2.2.3

**Description**:
Create page for accepting or declining invitations.

**Acceptance Criteria**:
- [ ] Route: `/invite/:token`
- [ ] Show workspace name, inviter name, role
- [ ] "Accept" and "Decline" buttons
- [ ] Handle expired invitations (show error)
- [ ] Handle invalid tokens (show error)
- [ ] Redirect to login if not authenticated
- [ ] Redirect to workspace after accepting
- [ ] Show confirmation after declining

---

### Task 2.2.9: Unit Tests for Invitation Service
**Story**: User Story 2.2
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 2.2.2

**Description**:
Write unit tests for invitation service.

**Test Cases**:
- [ ] Create invitation successfully
- [ ] Generate unique token
- [ ] Set correct expiration date
- [ ] Validate invitation token
- [ ] Reject expired invitation
- [ ] Reject invalid token
- [ ] Accept invitation adds user to workspace
- [ ] Reject if user already member
- [ ] Revoke invitation successfully

---

### Task 2.2.10: Integration Tests for Invitation API
**Story**: User Story 2.2
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 2.2.3

**Description**:
Write integration tests for invitation endpoints.

**Test Cases**:
- [ ] POST /invitations - creates invitation and sends email
- [ ] POST /invitations - rejects unauthorized user
- [ ] POST /invitations/bulk - creates multiple invitations
- [ ] GET /invitations - lists pending invitations
- [ ] POST /invitations/:token/accept - adds user to workspace
- [ ] DELETE /invitations/:id - revokes invitation

---

### Task 2.3.1: Member Management Service
**Story**: User Story 2.3
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Sprint 1 (WorkspaceMember model)

**Description**:
Create service for managing workspace members.

**Acceptance Criteria**:
- [ ] `listWorkspaceMembers(workspaceId)` method
- [ ] `updateMemberRole(memberId, newRole)` method
- [ ] `removeMember(memberId)` method
- [ ] Permission checks (only Owner/Admin can modify)
- [ ] Cannot remove workspace owner
- [ ] Cannot change owner's role
- [ ] Role change takes effect immediately
- [ ] Member removal revokes all access

---

### Task 2.3.2: Member Management API Endpoints
**Story**: User Story 2.3
**Estimate**: 2 hours
**Priority**: High
**Dependencies**: Task 2.3.1

**Description**:
Create REST API endpoints for member management.

**Endpoints**:
- [ ] `GET /api/v1/workspaces/:workspaceId/members` - List members
- [ ] `PATCH /api/v1/workspaces/:workspaceId/members/:memberId` - Update role
- [ ] `DELETE /api/v1/workspaces/:workspaceId/members/:memberId` - Remove member

**Validation**:
- [ ] Role validation (OWNER, ADMIN, MEMBER, VIEWER)
- [ ] Permission validation
- [ ] Cannot modify own role
- [ ] Cannot remove self (use leave endpoint instead)

---

### Task 2.3.3: Permission Middleware
**Story**: User Story 2.3
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Task 2.3.1

**Description**:
Create middleware to enforce role-based permissions.

**Acceptance Criteria**:
- [ ] `requireWorkspaceRole(['OWNER', 'ADMIN'])` middleware
- [ ] `requireProjectRole(['OWNER', 'ADMIN'])` middleware
- [ ] `canEditTask(taskId, userId)` helper
- [ ] `canDeleteTask(taskId, userId)` helper
- [ ] Permission denied returns 403 Forbidden
- [ ] Include detailed error message

**Permission Matrix**:
Implement permission checks based on role table in User Story 2.3.

---

### Task 2.3.4: Member Management UI - Members List
**Story**: User Story 2.3
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Task 2.3.2

**Description**:
Create UI for viewing and managing workspace members.

**Acceptance Criteria**:
- [ ] Members list in workspace settings
- [ ] Member cards with avatar, name, email, role
- [ ] Role badge (Owner, Admin, Member, Viewer)
- [ ] "Change Role" dropdown for each member
- [ ] "Remove Member" button
- [ ] Owner badge (cannot be changed)
- [ ] Only show actions if user has permission
- [ ] Confirmation dialog for removing members

---

### Task 2.3.5: Role Change Confirmation
**Story**: User Story 2.3
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 2.3.4

**Description**:
Add confirmation dialog for critical member actions.

**Acceptance Criteria**:
- [ ] Confirmation dialog for role changes
- [ ] Show current role → new role
- [ ] Warn about permission changes
- [ ] Confirmation dialog for removing member
- [ ] Show member name and warning message
- [ ] "Cancel" and "Confirm" buttons
- [ ] Loading state during API call

---

### Task 2.3.6: Unit Tests for Permission Middleware
**Story**: User Story 2.3
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 2.3.3

**Description**:
Write unit tests for permission middleware.

**Test Cases**:
- [ ] Owner can perform all actions
- [ ] Admin can invite/remove members
- [ ] Admin cannot change owner role
- [ ] Member can only edit assigned tasks
- [ ] Viewer cannot edit anything
- [ ] Permission denied returns 403

---

### Task 3.2.1: Comment Service (Backend)
**Story**: User Story 3.2
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Sprint 1 (Comment model)

**Description**:
Create service for managing task comments.

**Acceptance Criteria**:
- [ ] `createComment(taskId, userId, content)` method
- [ ] `updateComment(commentId, content)` method (within 15 min)
- [ ] `deleteComment(commentId)` method
- [ ] `listTaskComments(taskId)` method
- [ ] Parse @mentions in comments
- [ ] Return comments with author details
- [ ] Sort comments by createdAt (oldest first)

---

### Task 3.2.2: Comment API Endpoints
**Story**: User Story 3.2
**Estimate**: 2 hours
**Priority**: High
**Dependencies**: Task 3.2.1

**Description**:
Create REST API endpoints for comments.

**Endpoints**:
- [ ] `POST /api/v1/tasks/:taskId/comments` - Create comment
- [ ] `GET /api/v1/tasks/:taskId/comments` - List comments
- [ ] `PATCH /api/v1/comments/:commentId` - Update comment
- [ ] `DELETE /api/v1/comments/:commentId` - Delete comment

**Validation**:
- [ ] Content required (1-2000 characters)
- [ ] User can only edit own comments
- [ ] Edit only within 15 minutes
- [ ] User can only delete own comments

---

### Task 3.2.3: @Mention Parsing & Notifications
**Story**: User Story 3.2
**Estimate**: 3 hours
**Priority**: Medium
**Dependencies**: Task 3.2.1

**Description**:
Parse @mentions in comments and create notifications.

**Acceptance Criteria**:
- [ ] Detect @mentions in comment content
- [ ] Validate mentioned users are workspace members
- [ ] Create notification for each mentioned user
- [ ] Notification links to comment
- [ ] Highlight @mentions in comment UI
- [ ] Autocomplete for @mentions

---

### Task 3.2.4: Comment UI Component
**Story**: User Story 3.2
**Estimate**: 4 hours
**Priority**: High
**Dependencies**: Task 3.2.2

**Description**:
Create comment UI component for task detail page.

**Acceptance Criteria**:
- [ ] Comment list component
- [ ] Comment item with author avatar, name, timestamp
- [ ] Markdown rendering for comment content
- [ ] "Edit" button (own comments, within 15 min)
- [ ] "Delete" button (own comments)
- [ ] Comment input field with markdown support
- [ ] "Post Comment" button
- [ ] Loading states for actions
- [ ] Optimistic UI updates
- [ ] Real-time comment updates

**UI Components**:
- `CommentList.tsx`
- `CommentItem.tsx`
- `CommentInput.tsx` (with markdown editor)

---

### Task 3.2.5: Markdown Editor for Comments
**Story**: User Story 3.2
**Estimate**: 3 hours
**Priority**: Medium
**Dependencies**: Task 3.2.4

**Description**:
Integrate markdown editor for comments.

**Acceptance Criteria**:
- [ ] Markdown syntax highlighting
- [ ] Toolbar for formatting (bold, italic, code, link)
- [ ] Preview tab
- [ ] @mention autocomplete
- [ ] Character count (2000 max)
- [ ] Keyboard shortcuts (Ctrl+B for bold, etc.)

**Libraries**:
- Consider: react-markdown, remark, rehype

---

### Task 3.2.6: Unit Tests for Comment Service
**Story**: User Story 3.2
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 3.2.1

**Description**:
Write unit tests for comment service.

**Test Cases**:
- [ ] Create comment successfully
- [ ] Parse @mentions correctly
- [ ] Update comment within 15 minutes
- [ ] Reject update after 15 minutes
- [ ] Delete comment successfully
- [ ] Only author can edit/delete

---

### Task 3.3.1: WebSocket Server Setup
**Story**: User Story 3.3
**Estimate**: 4 hours
**Priority**: High
**Dependencies**: None

**Description**:
Set up Socket.io server for real-time features.

**Acceptance Criteria**:
- [ ] Install Socket.io server
- [ ] Configure CORS for WebSocket
- [ ] JWT authentication for WebSocket connections
- [ ] Room-based architecture (workspace, project, task)
- [ ] Connection/disconnection logging
- [ ] Heartbeat/ping mechanism
- [ ] Auto-reconnect on client

**Room Structure**:
- `workspace:{workspaceId}` - Workspace-level events
- `project:{projectId}` - Project-level events
- `task:{taskId}` - Task-level events

---

### Task 3.3.2: Redis Pub/Sub for Multi-Server Support
**Story**: User Story 3.3
**Estimate**: 3 hours
**Priority**: Medium
**Dependencies**: Task 3.3.1

**Description**:
Set up Redis pub/sub for WebSocket events across multiple servers.

**Acceptance Criteria**:
- [ ] Install Redis adapter for Socket.io
- [ ] Configure Redis connection
- [ ] Publish events to Redis
- [ ] Subscribe to Redis events
- [ ] Test with multiple server instances
- [ ] Handle Redis connection failures gracefully

---

### Task 3.3.3: Real-time Event Emitters
**Story**: User Story 3.3
**Estimate**: 4 hours
**Priority**: High
**Dependencies**: Task 3.3.1

**Description**:
Emit real-time events for task, comment, and member changes.

**Events to Emit**:
- [ ] `task:created` - New task created
- [ ] `task:updated` - Task updated
- [ ] `task:deleted` - Task deleted
- [ ] `task:moved` - Task moved to different status
- [ ] `comment:created` - New comment
- [ ] `comment:updated` - Comment edited
- [ ] `comment:deleted` - Comment deleted
- [ ] `member:joined` - New member added
- [ ] `member:left` - Member removed

**Event Payload**:
```typescript
{
  event: 'task:updated',
  data: { taskId, updates, updatedBy },
  timestamp: Date,
  workspaceId: string,
  projectId: string
}
```

---

### Task 3.3.4: WebSocket Client Setup (Frontend)
**Story**: User Story 3.3
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Task 3.3.1

**Description**:
Set up Socket.io client in Next.js frontend.

**Acceptance Criteria**:
- [ ] Install Socket.io client
- [ ] Create WebSocket context provider
- [ ] Connect with JWT token
- [ ] Auto-reconnect on disconnect
- [ ] Join/leave rooms based on current page
- [ ] Graceful degradation (polling fallback)
- [ ] Connection status indicator

**Context API**:
```typescript
const { socket, connected, joinRoom, leaveRoom } = useWebSocket()
```

---

### Task 3.3.5: Real-time UI Updates
**Story**: User Story 3.3
**Estimate**: 4 hours
**Priority**: High
**Dependencies**: Task 3.3.4

**Description**:
Update UI in real-time when events are received.

**Acceptance Criteria**:
- [ ] Task board updates when tasks move
- [ ] Task detail updates when task changes
- [ ] Comment list updates when new comment
- [ ] Optimistic UI updates (immediate feedback)
- [ ] Conflict resolution for simultaneous edits
- [ ] "Someone else updated this" warning
- [ ] Reload button to fetch latest data

---

### Task 3.3.6: User Presence Tracking
**Story**: User Story 3.3
**Estimate**: 3 hours
**Priority**: Medium
**Dependencies**: Task 3.3.4

**Description**:
Show which users are currently viewing tasks/projects.

**Acceptance Criteria**:
- [ ] Track users viewing each task
- [ ] Display user avatars on task detail page
- [ ] "John and 2 others are viewing this"
- [ ] Update presence in real-time
- [ ] Remove user on disconnect
- [ ] Presence timeout (30 seconds of inactivity)

---

### Task 3.3.7: Typing Indicators for Comments
**Story**: User Story 3.3
**Estimate**: 2 hours
**Priority**: Low
**Dependencies**: Task 3.3.4

**Description**:
Show typing indicators when someone is writing a comment.

**Acceptance Criteria**:
- [ ] Emit typing event on comment input
- [ ] Show "John is typing..." below comments
- [ ] Hide typing indicator after 3 seconds of inactivity
- [ ] Debounce typing events (send every 500ms max)

---

### Task 3.3.8: Integration Tests for WebSocket
**Story**: User Story 3.3
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 3.3.3

**Description**:
Write integration tests for WebSocket events.

**Test Cases**:
- [ ] Client connects successfully with JWT
- [ ] Client joins room
- [ ] Event broadcast to room members
- [ ] Client receives events
- [ ] Auto-reconnect on disconnect
- [ ] Graceful disconnect

---

### Task 1.4.1: Onboarding Flow Service
**Story**: User Story 1.4
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Sprint 1 (User model)

**Description**:
Track user onboarding progress in database.

**Acceptance Criteria**:
- [ ] Add `onboardingCompleted` field to User model
- [ ] Add `onboardingStep` field to track progress
- [ ] API endpoint to update onboarding progress
- [ ] API endpoint to skip onboarding
- [ ] API endpoint to reset onboarding (replay)

---

### Task 1.4.2: Onboarding UI Components
**Story**: User Story 1.4
**Estimate**: 5 hours
**Priority**: Medium
**Dependencies**: Task 1.4.1

**Description**:
Create interactive onboarding UI.

**Acceptance Criteria**:
- [ ] Onboarding modal/overlay
- [ ] Progress indicator (1/5, 2/5, etc.)
- [ ] Step 1: Create workspace form
- [ ] Step 2: Create project form
- [ ] Step 3: Create task form
- [ ] Step 4: Kanban board demo
- [ ] Step 5: Invite members form
- [ ] "Next" and "Back" buttons
- [ ] "Skip Tutorial" link
- [ ] Confetti animation on completion

**UI Components**:
- `OnboardingModal.tsx`
- `OnboardingStep.tsx`
- `OnboardingProgress.tsx`

---

### Task 1.4.3: Demo Data Generation
**Story**: User Story 1.4
**Estimate**: 2 hours
**Priority**: Low
**Dependencies**: Task 1.4.2

**Description**:
Generate demo workspace/project/tasks for exploration.

**Acceptance Criteria**:
- [ ] Create "Demo Workspace" on first login
- [ ] Create "Sample Project" with demo tasks
- [ ] Tasks in different statuses (Todo, In Progress, Done)
- [ ] Sample comments on tasks
- [ ] Sample labels (Bug, Feature, Documentation)
- [ ] User can delete demo workspace

---

### Task 1.4.4: Replay Onboarding from Settings
**Story**: User Story 1.4
**Estimate**: 1 hour
**Priority**: Low
**Dependencies**: Task 1.4.2

**Description**:
Allow users to replay onboarding tutorial.

**Acceptance Criteria**:
- [ ] "Replay Tutorial" button in user settings
- [ ] Reset onboarding progress
- [ ] Launch onboarding modal
- [ ] Don't create new demo data if exists

---

### Task 3.4.1: Activity Feed Service
**Story**: User Story 3.4
**Estimate**: 3 hours
**Priority**: Medium
**Dependencies**: Sprint 1 (Activity model)

**Description**:
Create service to query and format activity feed.

**Acceptance Criteria**:
- [ ] `getWorkspaceActivity(workspaceId, filters)` method
- [ ] `getProjectActivity(projectId, filters)` method
- [ ] Filter by activity type
- [ ] Filter by user
- [ ] Filter by date range
- [ ] Pagination support (20 items per page)
- [ ] Group activities by day

**Activity Types**:
- `TASK_CREATED`, `TASK_UPDATED`, `TASK_COMPLETED`, `TASK_DELETED`
- `COMMENT_CREATED`, `COMMENT_UPDATED`, `COMMENT_DELETED`
- `MEMBER_JOINED`, `MEMBER_LEFT`, `MEMBER_ROLE_CHANGED`
- `PROJECT_CREATED`, `PROJECT_ARCHIVED`

---

### Task 3.4.2: Activity Feed API Endpoints
**Story**: User Story 3.4
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 3.4.1

**Description**:
Create REST API endpoints for activity feed.

**Endpoints**:
- [ ] `GET /api/v1/workspaces/:workspaceId/activity` - Workspace activity
- [ ] `GET /api/v1/projects/:projectId/activity` - Project activity

**Query Parameters**:
- `type` - Filter by activity type
- `userId` - Filter by user
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `page` - Pagination
- `limit` - Items per page (default 20, max 100)

---

### Task 3.4.3: Activity Feed UI Component
**Story**: User Story 3.4
**Estimate**: 4 hours
**Priority**: Medium
**Dependencies**: Task 3.4.2

**Description**:
Create activity feed UI component.

**Acceptance Criteria**:
- [ ] Activity feed panel in workspace/project sidebar
- [ ] Activity items with icon, description, timestamp
- [ ] Group activities by day (Today, Yesterday, March 15)
- [ ] Relative timestamps (2 hours ago, Yesterday at 3:45 PM)
- [ ] Click activity to navigate to task/comment
- [ ] Filter dropdown (All, Tasks, Comments, Members)
- [ ] "Load More" button
- [ ] Real-time activity updates
- [ ] Empty state when no activity

**Activity Item Format**:
```
[Icon] John Doe created task "Fix login bug" in Website Redesign
       2 hours ago
```

---

### Task 3.4.4: Activity Icons & Formatting
**Story**: User Story 3.4
**Estimate**: 2 hours
**Priority**: Low
**Dependencies**: Task 3.4.3

**Description**:
Design icons and formatting for each activity type.

**Acceptance Criteria**:
- [ ] Unique icon for each activity type
- [ ] Color coding (green for created, blue for updated, red for deleted)
- [ ] Bold actor name
- [ ] Bold entity name (task, project)
- [ ] Clickable links to entities
- [ ] Consistent formatting

---

### Task 3.5.1: Notification Service
**Story**: User Story 3.5
**Estimate**: 3 hours
**Priority**: High
**Dependencies**: Sprint 1 (User model)

**Description**:
Create notification service for in-app notifications.

**Acceptance Criteria**:
- [ ] Add Notification model to database
- [ ] `createNotification(userId, type, data)` method
- [ ] `listUserNotifications(userId, unreadOnly)` method
- [ ] `markAsRead(notificationId)` method
- [ ] `markAllAsRead(userId)` method
- [ ] Auto-create notifications for events (task assigned, @mention, etc.)

**Notification Model**:
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  message   String
  linkUrl   String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, isRead])
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_DUE_SOON
  MENTION
  COMMENT
  WORKSPACE_INVITE
  TASK_COMPLETED
}
```

---

### Task 3.5.2: Notification API Endpoints
**Story**: User Story 3.5
**Estimate**: 2 hours
**Priority**: High
**Dependencies**: Task 3.5.1

**Description**:
Create REST API endpoints for notifications.

**Endpoints**:
- [ ] `GET /api/v1/notifications` - List user notifications
- [ ] `GET /api/v1/notifications/unread/count` - Get unread count
- [ ] `PATCH /api/v1/notifications/:id/read` - Mark as read
- [ ] `PATCH /api/v1/notifications/read-all` - Mark all as read

---

### Task 3.5.3: Notification Center UI
**Story**: User Story 3.5
**Estimate**: 4 hours
**Priority**: High
**Dependencies**: Task 3.5.2

**Description**:
Create notification center UI component.

**Acceptance Criteria**:
- [ ] Bell icon in top navigation
- [ ] Unread count badge on bell icon
- [ ] Dropdown panel with notifications
- [ ] Notification items with icon, title, message, timestamp
- [ ] Unread notifications highlighted
- [ ] Click notification to navigate to link
- [ ] Click notification marks as read
- [ ] "Mark all as read" button
- [ ] "View all notifications" link
- [ ] Real-time notification updates
- [ ] Sound/desktop notification (optional)

---

### Task 3.5.4: Notification Preferences UI
**Story**: User Story 3.5
**Estimate**: 3 hours
**Priority**: Medium
**Dependencies**: Task 3.5.1

**Description**:
Create UI for notification preferences.

**Acceptance Criteria**:
- [ ] Notification settings in user profile
- [ ] Toggle for each notification type
- [ ] In-app notification toggle
- [ ] Email notification toggle (per type)
- [ ] "Do Not Disturb" mode
- [ ] Save preferences to database
- [ ] Respect user preferences when creating notifications

---

### Task 3.5.5: Email Notification System
**Story**: User Story 3.5
**Estimate**: 3 hours
**Priority**: Low
**Dependencies**: Task 3.5.1

**Description**:
Send email notifications based on user preferences.

**Acceptance Criteria**:
- [ ] Email templates for each notification type
- [ ] Queue email jobs (async)
- [ ] Respect user email preferences
- [ ] Batch digest emails (daily summary option)
- [ ] Unsubscribe link in emails
- [ ] Email open/click tracking

---

### Task 3.5.6: Notification Unit Tests
**Story**: User Story 3.5
**Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Task 3.5.1

**Description**:
Write unit tests for notification service.

**Test Cases**:
- [ ] Create notification successfully
- [ ] List user notifications
- [ ] Filter unread notifications
- [ ] Mark notification as read
- [ ] Mark all as read
- [ ] Respect user preferences
- [ ] Don't send if notification disabled

---

## Sprint Schedule

### Week 1 (Days 1-5)

#### Day 1-2: Invitations
- Task 2.2.1: Database schema (2h)
- Task 2.2.2: Invitation service (3h)
- Task 2.2.3: Invitation API (3h)
- Task 2.2.4: Email template (2h)
- Task 2.2.5: Send invitation email (2h)
- Task 2.2.6: Invite modal UI (3h)

#### Day 3: Invitations & Member Management
- Task 2.2.7: Pending invitations list (2h)
- Task 2.2.8: Accept/decline page (3h)
- Task 2.3.1: Member management service (3h)

#### Day 4: Member Management & Comments
- Task 2.3.2: Member API (2h)
- Task 2.3.3: Permission middleware (3h)
- Task 2.3.4: Members list UI (3h)
- Task 3.2.1: Comment service (3h)

#### Day 5: Comments
- Task 3.2.2: Comment API (2h)
- Task 3.2.3: @Mention parsing (3h)
- Task 3.2.4: Comment UI (4h)

### Week 2 (Days 6-10)

#### Day 6-7: Real-time Collaboration
- Task 3.3.1: WebSocket server (4h)
- Task 3.3.2: Redis pub/sub (3h)
- Task 3.3.3: Event emitters (4h)
- Task 3.3.4: WebSocket client (3h)

#### Day 8: Real-time & Notifications
- Task 3.3.5: Real-time UI updates (4h)
- Task 3.3.6: User presence (3h)
- Task 3.5.1: Notification service (3h)

#### Day 9: Notifications & Activity Feed
- Task 3.5.2: Notification API (2h)
- Task 3.5.3: Notification center UI (4h)
- Task 3.4.1: Activity feed service (3h)
- Task 3.4.2: Activity feed API (2h)

#### Day 10: Onboarding & Polish
- Task 1.4.1: Onboarding service (2h)
- Task 1.4.2: Onboarding UI (5h)
- Task 3.4.3: Activity feed UI (4h)
- Testing & bug fixes

---

## Testing Strategy

### Unit Tests
- Invitation service
- Member management service
- Comment service
- Permission middleware
- Notification service
- Activity feed service

**Target Coverage**: 80%+

### Integration Tests
- Invitation API endpoints
- Member management API endpoints
- Comment API endpoints
- WebSocket events
- Notification API endpoints

### E2E Tests (Playwright)
- [ ] Complete invitation flow (send → accept → join workspace)
- [ ] Member role change flow
- [ ] Create comment with @mention
- [ ] Real-time task update propagation
- [ ] Notification creation and marking as read
- [ ] Onboarding flow completion

---

## Definition of Done

A user story is considered "Done" when:

1. ✅ All acceptance criteria met
2. ✅ All tasks completed
3. ✅ Unit tests written and passing (80%+ coverage)
4. ✅ Integration tests written and passing
5. ✅ E2E tests written and passing
6. ✅ Code reviewed and approved
7. ✅ Merged to main branch
8. ✅ Deployed to staging environment
9. ✅ Manually tested by another developer
10. ✅ Documentation updated (API docs, README)

---

## Risk & Mitigation

### Risk 1: WebSocket Complexity
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Start with basic WebSocket setup early (Day 6)
- Test with multiple clients
- Implement polling fallback
- Keep event payloads simple

### Risk 2: Email Deliverability
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Use reliable email service (Resend/SendGrid)
- Implement retry logic
- Monitor delivery rates
- Test spam filters

### Risk 3: Real-time UI Conflicts
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Implement optimistic UI carefully
- Add "Someone else updated this" warnings
- Provide manual refresh option
- Test simultaneous edits thoroughly

### Risk 4: Permission System Complexity
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Define clear permission matrix
- Write comprehensive tests
- Review permission logic carefully
- Test edge cases (owner removal, etc.)

---

## Dependencies

### External Services Required
1. **Email Service**: Resend or SendGrid
   - API key configuration
   - Domain verification
   - Email templates

2. **Redis**: For WebSocket pub/sub
   - Redis instance (Docker or cloud)
   - Connection configuration

### Sprint 1 Features Required
- ✅ User authentication (JWT)
- ✅ Workspace creation
- ✅ Project creation
- ✅ Task CRUD
- ✅ Database models (User, Workspace, Project, Task, Comment, Activity, Invitation)

---

## Success Metrics

### Velocity
- **Target**: 35-40 story points completed
- **Minimum**: 30 story points (78%)

### Quality
- **Test Coverage**: >80%
- **Bug Count**: <10 bugs found in sprint
- **Code Review Cycle**: <6 hours average

### User Experience
- **Invitation email delivery**: <30 seconds
- **Real-time update latency**: <500ms
- **Notification creation**: <100ms
- **WebSocket connection success**: >95%

---

## Notes

- Focus on core collaboration features first (invitations, comments)
- Real-time features can be incrementally enhanced post-sprint
- Onboarding is lower priority - can be simplified if time constrained
- Email notifications can be deferred to Sprint 3 if needed

---

**Sprint Start Date**: TBD
**Sprint End Date**: TBD
**Sprint Review Date**: TBD
**Sprint Retrospective Date**: TBD
