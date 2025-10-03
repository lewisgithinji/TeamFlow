# Invitation System Documentation

## Overview

The TeamFlow Invitation System allows workspace owners and admins to invite team members via email. The system includes token-based invitations, role assignment, email notifications, and comprehensive permission controls.

---

## Architecture

### Packages

1. **@teamflow/invitation**
   - Core invitation logic
   - Service layer for CRUD operations
   - Token generation and validation
   - Email integration

2. **@teamflow/email**
   - Email service with Resend integration
   - React Email templates
   - Type-safe email sending

3. **@teamflow/workspace**
   - Member management
   - Permission utilities
   - Role-based access control

---

## Features

### ✅ Invitation Creation
- Send email invitations with custom roles
- Auto-generate secure tokens
- 7-day expiration (configurable)
- Prevent duplicate invitations
- Check for existing members

### ✅ Invitation Acceptance
- Public invitation page
- Token verification
- Email validation
- Auto-add to workspace
- Activity logging

### ✅ Invitation Management
- List pending invitations
- Resend with new token
- Revoke invitations
- Filter by status/email

### ✅ Member Management
- List workspace members
- Update member roles
- Remove members
- Role-based permissions
- Activity tracking

### ✅ Permission System
- Role hierarchy (Viewer < Member < Admin < Owner)
- Action-based permissions
- Permission middleware
- Owner protection

---

## API Routes

### Invitations

#### `POST /api/invitations`
Create a new invitation

**Request:**
```json
{
  "workspaceId": "uuid",
  "email": "user@example.com",
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "invitation": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "MEMBER",
    "token": "secure-token",
    "expiresAt": "2025-10-09T...",
    "workspace": { ... },
    "inviter": { ... }
  }
}
```

#### `GET /api/invitations?workspaceId=uuid`
List workspace invitations

**Query Params:**
- `workspaceId` (required): Workspace UUID
- `accepted`: Boolean filter
- `email`: Search by email

#### `GET /api/invitations/verify?token=xxx`
Verify an invitation token

**Response:**
```json
{
  "invitation": {
    "id": "uuid",
    "email": "user@example.com",
    "workspace": { "name": "..." },
    "inviter": { "name": "..." }
  }
}
```

#### `POST /api/invitations/[invitationId]/accept`
Accept an invitation

**Request:**
```json
{
  "token": "secure-token"
}
```

#### `POST /api/invitations/[invitationId]/resend`
Resend an invitation

**Request:**
```json
{
  "workspaceId": "uuid"
}
```

#### `POST /api/invitations/[invitationId]/revoke`
Revoke an invitation

**Request:**
```json
{
  "workspaceId": "uuid"
}
```

### Members

#### `GET /api/workspaces/[workspaceId]/members`
List workspace members

**Query Params:**
- `role`: Filter by role
- `search`: Search by name/email

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "role": "MEMBER",
      "joinedAt": "2025-10-02T...",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "url"
      }
    }
  ]
}
```

#### `PATCH /api/workspaces/[workspaceId]/members/[memberId]`
Update member role

**Request:**
```json
{
  "newRole": "ADMIN"
}
```

#### `DELETE /api/workspaces/[workspaceId]/members/[memberId]`
Remove a member

---

## Components

### InviteUserDialog

Modal dialog for inviting users to workspace.

**Usage:**
```tsx
import { InviteUserDialog } from '@/components/invitation';

<InviteUserDialog
  workspaceId="workspace-uuid"
  trigger={<Button>Invite User</Button>}
  onSuccess={() => refetch()}
/>
```

**Props:**
- `workspaceId`: Workspace UUID
- `trigger`: Custom trigger button (optional)
- `onSuccess`: Callback after successful invite

### InvitationsList

Table view of pending invitations with resend/revoke actions.

**Usage:**
```tsx
import { InvitationsList } from '@/components/invitation';

<InvitationsList workspaceId="workspace-uuid" />
```

**Props:**
- `workspaceId`: Workspace UUID

### Invite Accept Page

Public page for accepting invitations at `/invite/[token]`.

**Features:**
- Workspace preview
- Inviter information
- Auto-redirect to sign-in if not authenticated
- Email validation
- Expiry checking
- Success/error states

---

## Permission System

### Roles

```typescript
enum WorkspaceRole {
  VIEWER    // Read-only access
  MEMBER    // Can create/edit tasks
  ADMIN     // Can manage workspace
  OWNER     // Full control
}
```

### Role Hierarchy

```
OWNER (4) > ADMIN (3) > MEMBER (2) > VIEWER (1)
```

### Actions

**Viewer:**
- `workspace:read`
- `project:read`
- `task:read`
- `comment:read`

**Member:**
- All Viewer actions
- `project:create`
- `task:create`, `task:update`, `task:assign`
- `comment:create`, `comment:update_own`, `comment:delete_own`

**Admin:**
- All Member actions
- `workspace:update`
- `project:update`, `project:delete`
- `task:delete`
- `comment:update`, `comment:delete`
- `member:invite`, `member:remove`, `member:update_role`

**Owner:**
- All Admin actions
- `workspace:delete`, `workspace:transfer`
- `integration:manage`

### Permission Middleware

**Usage in API routes:**
```typescript
import { checkPermission } from '@/lib/middleware/permissions';
import { WorkspaceRole } from '@teamflow/database';

export async function GET(request: NextRequest) {
  // Check minimum role
  const error = await checkPermission(request, {
    workspaceId: 'uuid',
    requiredRole: WorkspaceRole.VIEWER,
  });

  if (error) return error;

  // ... route logic
}
```

**Check specific action:**
```typescript
const error = await checkPermission(request, {
  workspaceId: 'uuid',
  action: 'member:invite',
});
```

---

## Service Layer

### InvitationService

```typescript
import { invitationService } from '@teamflow/invitation';

// Create invitation
const invitation = await invitationService.createInvitation({
  workspaceId: 'uuid',
  email: 'user@example.com',
  role: WorkspaceRole.MEMBER,
  invitedBy: 'user-uuid',
});

// Accept invitation
await invitationService.acceptInvitation({
  token: 'secure-token',
  userId: 'user-uuid',
});

// List invitations
const invitations = await invitationService.listInvitations({
  workspaceId: 'uuid',
  accepted: false,
});

// Resend invitation
await invitationService.resendInvitation({
  invitationId: 'uuid',
  workspaceId: 'uuid',
});

// Revoke invitation
await invitationService.revokeInvitation({
  invitationId: 'uuid',
  workspaceId: 'uuid',
});
```

### MemberService

```typescript
import { memberService } from '@teamflow/workspace';

// List members
const members = await memberService.listMembers({
  workspaceId: 'uuid',
  role: WorkspaceRole.MEMBER,
  search: 'john',
});

// Update role
await memberService.updateMemberRole({
  workspaceId: 'uuid',
  memberId: 'uuid',
  newRole: WorkspaceRole.ADMIN,
  updatedBy: 'user-uuid',
});

// Remove member
await memberService.removeMember({
  workspaceId: 'uuid',
  memberId: 'uuid',
  removedBy: 'user-uuid',
});

// Check permission
const hasAccess = await memberService.checkPermission({
  userId: 'uuid',
  workspaceId: 'uuid',
  requiredRole: WorkspaceRole.ADMIN,
});
```

### EmailService

```typescript
import { sendEmail } from '@teamflow/email';

await sendEmail({
  to: 'user@example.com',
  subject: 'You've been invited to TeamFlow',
  template: 'workspace-invitation',
  data: {
    workspaceName: 'My Workspace',
    inviterName: 'John Doe',
    inviteUrl: 'https://app.teamflow.com/invite/token',
    role: 'MEMBER',
    expiresAt: new Date(),
  },
});
```

---

## Configuration

### Environment Variables

```bash
# Email Service
EMAIL_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=TeamFlow <noreply@teamflow.com>
EMAIL_REPLY_TO=support@teamflow.com

# App URL (for invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...
```

### Email Templates

Templates are built with [React Email](https://react.email/):

- `WorkspaceInvitationEmail.tsx`
- `PasswordResetEmail.tsx`
- `VerifyEmailEmail.tsx`

**Customize templates:**
```tsx
// packages/email/templates/WorkspaceInvitationEmail.tsx

export const WorkspaceInvitationEmail = ({ ... }) => (
  <Html>
    <Body>
      {/* Your custom template */}
    </Body>
  </Html>
);
```

---

## Security

### Token Security
- Cryptographically secure random tokens (32 bytes)
- Base64URL encoding (URL-safe)
- 7-day expiration
- Single-use (marked as accepted)

### Permission Checks
- All routes check authentication
- Workspace membership verified
- Role-based authorization
- Owner protection (cannot remove/demote)

### Email Validation
- Invitation email must match user email
- Prevents invitation hijacking
- Session email validation

### Activity Logging
- All member actions logged
- Invitation acceptance tracked
- Audit trail for compliance

---

## Testing

### Manual Testing Checklist

**Invitation Flow:**
- [ ] Create invitation
- [ ] Receive email
- [ ] Click invitation link
- [ ] Sign in if needed
- [ ] Accept invitation
- [ ] Verify workspace access

**Permission Testing:**
- [ ] Viewer cannot invite
- [ ] Member cannot invite
- [ ] Admin can invite
- [ ] Owner can invite
- [ ] Cannot remove owner
- [ ] Cannot change owner role

**Edge Cases:**
- [ ] Expired invitation
- [ ] Already accepted
- [ ] Already a member
- [ ] Email mismatch
- [ ] Duplicate invitation

---

## Troubleshooting

### Email not sending

**Check:**
1. `EMAIL_API_KEY` is set
2. Resend API key is valid
3. Email domain verified
4. Check console logs

**Mock mode:**
If no API key is set, emails are logged to console instead of being sent.

### Permission denied

**Check:**
1. User is workspace member
2. User has required role
3. Not trying to manage higher role
4. Not trying to modify owner

### Token expired

**Solution:**
Use the resend feature to generate a new token with fresh expiration.

### Database errors

**Check:**
1. Prisma client generated: `pnpm db:generate`
2. Migrations applied: `pnpm db:push`
3. Database connection working

---

## Future Enhancements

### Planned Features
- [ ] Bulk invite from CSV
- [ ] Custom invitation messages
- [ ] Invitation templates per workspace
- [ ] SSO integration
- [ ] Domain-based auto-approval
- [ ] Invitation analytics

### Performance Optimizations
- [ ] Rate limiting on invitations
- [ ] Email queue with retry
- [ ] Cached permission checks
- [ ] Background job for expired invitations

---

## Related Documentation

- [Sprint 2 Planning](../sprints/sprint-2/planning.md)
- [Member Management](./MEMBER_MANAGEMENT.md)
- [Permission System](./PERMISSIONS.md)
- [API Reference](../api/README.md)

---

**Last Updated**: October 2, 2025
**Status**: ✅ Implemented
