# Product Requirements Document: TeamFlow

## 1. Product Overview

TeamFlow is an AI-powered project management SaaS that bridges the gap between simple task boards and complex enterprise tools. Built for remote teams of 10-50 people, it provides intelligent sprint planning, task management, and real-time collaboration.

**Version**: 1.0 (MVP)
**Target Launch**: [6 months]
**Team**: 3 full-stack developers

## 2. User Stories & Features

---

### Epic 1: User Authentication & Onboarding

#### User Story 1.1: User Registration
**As a** new user  
**I want to** register with email/password or Google OAuth  
**So that** I can create an account and start using TeamFlow

**Priority**: P0 (Must-Have - MVP Blocker)  
**Story Points**: 5  
**Sprint**: Sprint 1

**Acceptance Criteria**:
- [ ] User can register with email and password
- [ ] Email must be unique and validated
- [ ] Password must be minimum 8 characters with 1 uppercase, 1 lowercase, 1 number
- [ ] Email verification link sent on registration
- [ ] User must verify email before accessing app
- [ ] Verification link expires after 24 hours
- [ ] User can register with Google OAuth
- [ ] OAuth creates account automatically
- [ ] Registration form shows validation errors in real-time
- [ ] Success message shown on registration
- [ ] User redirected to onboarding after verification

**Non-Functional Requirements**:
- Registration completes in < 2 seconds
- Email delivery within 30 seconds
- Secure password hashing (bcrypt)
- HTTPS required

**Dependencies**: None

**Technical Notes**:
- Use Zod for validation
- Store hashed passwords with bcrypt (10 rounds)
- JWT tokens for authentication
- SendGrid/Resend for emails

---

#### User Story 1.2: User Login
**As a** registered user  
**I want to** log in with my credentials  
**So that** I can access my projects and tasks

**Priority**: P0 (Must-Have)  
**Story Points**: 3  
**Sprint**: Sprint 1

**Acceptance Criteria**:
- [ ] User can login with email/password
- [ ] User can login with Google OAuth
- [ ] Invalid credentials show clear error message
- [ ] Account locked after 5 failed attempts (15 min lockout)
- [ ] "Remember me" option for persistent login
- [ ] JWT access token (15 min expiry) and refresh token (7 days)
- [ ] User redirected to last visited page after login
- [ ] "Forgot password" link visible on login page
- [ ] Login rate limited (10 attempts per IP per hour)

**Non-Functional Requirements**:
- Login completes in < 1 second
- Secure session management
- XSS/CSRF protection

**Dependencies**: User Story 1.1 (Registration)

---

#### User Story 1.3: Password Reset
**As a** user who forgot password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Priority**: P0 (Must-Have)  
**Story Points**: 3  
**Sprint**: Sprint 1

**Acceptance Criteria**:
- [ ] "Forgot password" link on login page
- [ ] User enters email address
- [ ] Reset link sent to email (if account exists)
- [ ] Same success message shown whether account exists or not (security)
- [ ] Reset link expires after 1 hour
- [ ] Reset link is single-use only
- [ ] User sets new password (same validation as registration)
- [ ] User automatically logged in after password reset
- [ ] All existing sessions invalidated on password reset

**Dependencies**: User Story 1.1

---

#### User Story 1.4: User Onboarding
**As a** new user  
**I want to** go through an interactive onboarding  
**So that** I understand how to use TeamFlow

**Priority**: P1 (Should-Have)  
**Story Points**: 5  
**Sprint**: Sprint 2

**Acceptance Criteria**:
- [ ] Interactive tutorial on first login
- [ ] Step 1: Create your first workspace
- [ ] Step 2: Create your first project
- [ ] Step 3: Create your first task
- [ ] Step 4: Try AI task breakdown (demo)
- [ ] Step 5: Invite team members
- [ ] User can skip onboarding
- [ ] User can replay tutorial from settings
- [ ] Demo data pre-loaded for exploration
- [ ] Progress indicator shows steps (1/5, 2/5, etc.)
- [ ] "Next" and "Back" buttons for navigation

**Dependencies**: Core project/task features must exist

---

### Epic 2: Workspace & Project Management

#### User Story 2.1: Create Workspace
**As a** team owner  
**I want to** create a workspace  
**So that** I can organize projects for my team

**Priority**: P0 (Must-Have)  
**Story Points**: 3  
**Sprint**: Sprint 1

**Acceptance Criteria**:
- [ ] User can create a workspace with name and description
- [ ] Workspace name is required (3-50 characters)
- [ ] User who creates workspace is automatically Owner
- [ ] Workspace has unique URL slug (e.g., teamflow.app/w/acme-corp)
- [ ] User can upload workspace logo/avatar
- [ ] Workspace settings page accessible to Owner/Admin
- [ ] Multiple workspaces supported per user
- [ ] Workspace switcher in navigation

**Non-Functional Requirements**:
- Workspace creation < 1 second
- Slug auto-generated from name (with uniqueness check)

**Dependencies**: User authentication

---

#### User Story 2.2: Invite Team Members
**As a** workspace owner  
**I want to** invite team members via email  
**So that** they can collaborate on projects

**Priority**: P0 (Must-Have)  
**Story Points**: 5  
**Sprint**: Sprint 2

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

**Dependencies**: User Story 2.1 (Workspaces)

---

#### User Story 2.3: Manage Team Members
**As a** workspace owner  
**I want to** manage team member roles and access  
**So that** I can control permissions

**Priority**: P0 (Must-Have)  
**Story Points**: 5  
**Sprint**: Sprint 2

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

**Dependencies**: User Story 2.2

---

#### User Story 2.4: Create Project
**As a** team member  
**I want to** create a project within a workspace  
**So that** I can organize related tasks

**Priority**: P0 (Must-Have)  
**Story Points**: 3  
**Sprint**: Sprint 2

**Acceptance Criteria**:
- [ ] User can create project with name, description, icon
- [ ] Project name required (3-100 characters)
- [ ] Project creator is automatically Admin of that project
- [ ] Project can be public (all workspace members) or private (invited only)
- [ ] Project has unique URL (e.g., /w/acme/p/website-redesign)
- [ ] Project displays in workspace project list
- [ ] User can archive/unarchive projects
- [ ] Archived projects hidden by default
- [ ] Project templates available (Kanban, Scrum, Bug Tracking)

**Dependencies**: User Story 2.1

---

### Epic 3: Task Management (Core Features)

#### User Story 3.1: Create & Edit Tasks
**As a** team member  
**I want to** create and edit tasks  
**So that** I can track work items

**Priority**: P0 (Must-Have)  
**Story Points**: 8  
**Sprint**: Sprint 3

**Acceptance Criteria**:
- [ ] User can create task with title (required)
- [ ] User can add description with markdown support
- [ ] User can set assignee(s) - single or multiple
- [ ] User can set due date
- [ ] User can set priority (Low, Medium, High, Critical)
- [ ] User can add labels/tags
- [ ] User can add story points (1, 2, 3, 5, 8, 13, 21)
- [ ] User can create sub-tasks/checklist items
- [ ] User can attach files (images, PDFs, docs)
- [ ] User can edit all task fields inline
- [ ] Task status auto-updates (Draft → Todo → In Progress → Done)
- [ ] Changes saved automatically (debounced)
- [ ] Markdown preview for descriptions
- [ ] File attachments support drag-and-drop
- [ ] Max 10MB per file, 50MB per task

**Task Fields**:
```typescript
Task {
  id: string
  title: string (required, 3-200 chars)
  description: string (markdown, optional)
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignees: User[] (multiple allowed)
  dueDate: Date | null
  storyPoints: 1 | 2 | 3 | 5 | 8 | 13 | 21 | null
  labels: Label[]
  subtasks: Subtask[]
  attachments: Attachment[]
  projectId: string
  createdBy: User
  createdAt: Date
  updatedAt: Date
}