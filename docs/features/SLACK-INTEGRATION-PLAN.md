# Slack Integration - BMAD Implementation Plan

**Feature**: Third-Party Integration - Slack
**Priority**: HIGH ⭐
**Estimated Time**: 2 weeks (10 working days)
**User Value**: 9/10
**Technical Complexity**: 7/10
**Status**: 🟡 Planning Phase

---

## 📋 PHASE 1: BRAINSTORM (Complete)

### Problem Statement
Teams live in Slack and context-switch between multiple tools. Without notifications in Slack, they miss critical updates about task assignments, status changes, and team activity. This leads to:
- Delayed responses to task assignments
- Missed deadlines and blockers
- Context switching between TeamFlow and communication tools
- Reduced team productivity

### User Stories

#### Core Stories
1. **As a team member**, I want Slack notifications when I'm assigned a task so that I don't miss important work
2. **As a developer**, I want to know when my code review is requested without checking TeamFlow constantly
3. **As a PM**, I want sprint deadline reminders sent to our team's Slack channel
4. **As a user**, I want to be notified in Slack when someone mentions me in comments
5. **As an admin**, I want to configure which events trigger Slack notifications for my workspace

#### Advanced Stories
6. **As a team member**, I want to mark tasks as done directly from Slack messages (interactive buttons)
7. **As a workspace admin**, I want to connect multiple Slack channels for different projects
8. **As a user**, I want to customize my personal notification preferences (DM vs channel, frequency)
9. **As a team**, I want workspace-level announcements for milestones (sprint started, project completed)

### Success Criteria

#### Must Have (Week 1-2)
- ✅ OAuth flow: Connect TeamFlow workspace to Slack workspace
- ✅ Personal DMs for task assignments
- ✅ Channel posts for team updates
- ✅ Rich message formatting (task title, link, assignee, priority)
- ✅ Notification preferences per user
- ✅ Events covered:
  - Task assigned to user
  - Task status changed
  - User mentioned in comment
  - Task due date approaching (24h warning)

#### Should Have (Week 2)
- ✅ Interactive buttons in messages (View Task, Mark as Done)
- ✅ Workspace-level announcements (sprint started/completed)
- ✅ Multiple Slack channels per workspace
- ✅ Notification frequency settings (instant, hourly digest, daily digest)

#### Could Have (Future)
- 🔮 Bidirectional sync: Update tasks from Slack commands
- 🔮 Slack slash commands (`/teamflow create task "Bug fix"`)
- 🔮 Thread conversations synced to task comments
- 🔮 @mention users in TeamFlow, notify in Slack

---

## 📐 PHASE 2: MODEL

### Data Models

#### 1. SlackIntegration Table
```prisma
model SlackIntegration {
  id                String   @id @default(uuid())
  workspaceId       String   @unique
  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Slack OAuth tokens
  accessToken       String   // Encrypted
  botUserId         String   // Slack bot user ID
  teamId            String   // Slack team/workspace ID
  teamName          String   // Slack workspace name

  // Configuration
  isActive          Boolean  @default(true)
  defaultChannelId  String?  // Default channel for workspace updates
  defaultChannelName String?

  // Metadata
  installedBy       String
  installedByUser   User     @relation(fields: [installedBy], references: [id])
  installedAt       DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  channelMappings   SlackChannelMapping[]
  userPreferences   SlackUserPreference[]

  @@index([workspaceId])
  @@index([teamId])
}
```

#### 2. SlackChannelMapping Table
```prisma
model SlackChannelMapping {
  id                String   @id @default(uuid())
  integrationId     String
  integration       SlackIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  projectId         String?  // Optional: map to specific project
  project           Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Slack channel details
  channelId         String   // Slack channel ID
  channelName       String   // Slack channel name
  channelType       String   // "public", "private", "dm"

  // Notification settings
  notifyOnAssignment   Boolean @default(true)
  notifyOnStatusChange Boolean @default(true)
  notifyOnComment      Boolean @default(true)
  notifyOnDueDate      Boolean @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([integrationId, channelId])
  @@index([projectId])
}
```

#### 3. SlackUserPreference Table
```prisma
model SlackUserPreference {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  integrationId     String
  integration       SlackIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  // Slack user mapping
  slackUserId       String?  // Slack user ID (if connected)
  slackUserName     String?  // Slack display name

  // Notification preferences
  enableDMs         Boolean  @default(true)  // Receive personal DMs
  enableChannelPosts Boolean @default(true)  // See in channel posts

  // Notification frequency
  frequency         String   @default("instant") // "instant", "hourly", "daily", "disabled"

  // Event preferences
  notifyOnAssignment   Boolean @default(true)
  notifyOnMention      Boolean @default(true)
  notifyOnStatusChange Boolean @default(true)
  notifyOnComment      Boolean @default(false)
  notifyOnDueDate      Boolean @default(true)

  // Quiet hours (optional)
  quietHoursStart   String?  // "22:00"
  quietHoursEnd     String?  // "08:00"
  quietHoursEnabled Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([userId, integrationId])
  @@index([slackUserId])
}
```

#### 4. Update Integration Table
```prisma
model Integration {
  // ... existing fields ...

  type              String   // Add "SLACK" to existing types
  slackIntegration  SlackIntegration?
}
```

### API Contracts

#### OAuth Flow Endpoints

**1. Initiate OAuth**
```typescript
GET /api/integrations/slack/oauth/start
Query: { workspaceId: string }
Response: { redirectUrl: string }

// Redirects to Slack OAuth page
// https://slack.com/oauth/v2/authorize?client_id=...&scope=...&state=...
```

**2. OAuth Callback**
```typescript
GET /api/integrations/slack/oauth/callback
Query: { code: string, state: string }
Response: {
  success: boolean
  integration: SlackIntegration
}

// Exchanges code for access token
// Stores encrypted token in database
// Redirects to workspace settings
```

**3. Disconnect Slack**
```typescript
DELETE /api/integrations/slack/:integrationId
Response: { success: boolean }

// Revokes Slack token
// Deletes integration and related data
```

#### Configuration Endpoints

**4. Get Integration Status**
```typescript
GET /api/integrations/slack/:workspaceId
Response: {
  isConnected: boolean
  integration?: {
    id: string
    teamName: string
    botUserId: string
    defaultChannel?: { id: string, name: string }
    installedAt: string
    installedBy: { id: string, name: string }
  }
  channelMappings: Array<{
    id: string
    channelName: string
    projectId?: string
    projectName?: string
    settings: NotificationSettings
  }>
}
```

**5. Update Integration Settings**
```typescript
PATCH /api/integrations/slack/:integrationId
Body: {
  defaultChannelId?: string
  defaultChannelName?: string
  isActive?: boolean
}
Response: { integration: SlackIntegration }
```

**6. Get Slack Channels**
```typescript
GET /api/integrations/slack/:integrationId/channels
Response: {
  channels: Array<{
    id: string
    name: string
    isPrivate: boolean
    isMember: boolean
  }>
}

// Fetches channels from Slack API
```

**7. Create Channel Mapping**
```typescript
POST /api/integrations/slack/:integrationId/channels
Body: {
  channelId: string
  channelName: string
  projectId?: string
  settings: {
    notifyOnAssignment: boolean
    notifyOnStatusChange: boolean
    notifyOnComment: boolean
    notifyOnDueDate: boolean
  }
}
Response: { mapping: SlackChannelMapping }
```

**8. Update Channel Mapping**
```typescript
PATCH /api/integrations/slack/channels/:mappingId
Body: {
  settings: NotificationSettings
}
Response: { mapping: SlackChannelMapping }
```

**9. Delete Channel Mapping**
```typescript
DELETE /api/integrations/slack/channels/:mappingId
Response: { success: boolean }
```

#### User Preference Endpoints

**10. Get User Preferences**
```typescript
GET /api/integrations/slack/:integrationId/preferences
Response: { preferences: SlackUserPreference }
```

**11. Update User Preferences**
```typescript
PATCH /api/integrations/slack/:integrationId/preferences
Body: {
  enableDMs?: boolean
  enableChannelPosts?: boolean
  frequency?: "instant" | "hourly" | "daily" | "disabled"
  notifyOnAssignment?: boolean
  notifyOnMention?: boolean
  notifyOnStatusChange?: boolean
  notifyOnComment?: boolean
  notifyOnDueDate?: boolean
  quietHours?: {
    enabled: boolean
    start: string
    end: string
  }
}
Response: { preferences: SlackUserPreference }
```

#### Notification Webhook Endpoint

**12. Slack Interactive Buttons**
```typescript
POST /api/integrations/slack/interactions
Body: {
  type: "block_actions"
  user: { id: string }
  actions: Array<{
    action_id: string
    value: string
  }>
}
Response: { ok: boolean }

// Handles button clicks from Slack messages
// Actions: "view_task", "mark_done", "claim_task"
```

### User Flows

#### Flow 1: Connect Slack Workspace

```
1. Admin opens TeamFlow Settings → Integrations
2. Clicks "Connect Slack" button
3. Redirected to Slack OAuth page
4. Admin reviews permissions:
   - chat:write (send messages)
   - chat:write.public (post to public channels)
   - users:read (read user info)
   - channels:read (list channels)
5. Admin clicks "Allow"
6. Redirected back to TeamFlow
7. TeamFlow exchanges code for access token
8. Token stored encrypted in database
9. Success message: "Slack workspace connected!"
10. Admin selects default channel for workspace updates
11. Channel mapping created
```

#### Flow 2: User Receives Task Assignment

```
1. PM assigns task to Alice in TeamFlow
2. Task assignment event triggered
3. Notification service checks:
   - Is Slack connected for this workspace? ✅
   - Does Alice have Slack preferences? ✅
   - Is frequency "instant"? ✅
   - Are DMs enabled? ✅
4. Build Slack message with:
   - Task title and description
   - Priority badge
   - Assignee (Alice)
   - Due date
   - Project name
   - "View Task" button
   - "Mark as Done" button
5. Send DM to Alice's Slack account
6. Alice sees notification in Slack
7. Clicks "View Task" → Opens TeamFlow in browser
```

#### Flow 3: Team Channel Notification

```
1. Developer moves task from "In Progress" to "Done"
2. Status change event triggered
3. Notification service checks:
   - Is Slack connected? ✅
   - Is task in a project with channel mapping? ✅
   - Are status change notifications enabled for channel? ✅
4. Build rich Slack message:
   - "@developer marked task as Done ✅"
   - Task title and link
   - Project context
   - Time tracking (if available)
5. Post to mapped Slack channel
6. Team sees update in real-time
```

#### Flow 4: Configure Personal Preferences

```
1. User opens TeamFlow Settings → Notifications → Slack
2. Sees current preferences:
   - DMs: Enabled
   - Frequency: Instant
   - Events: Assignment ✅, Mentions ✅, Status ❌
3. User changes:
   - Frequency: Daily digest
   - Events: Enable status changes
   - Quiet hours: 22:00 - 08:00
4. Clicks "Save Preferences"
5. Settings updated in database
6. Future notifications respect new preferences
```

---

## 🏗️ PHASE 3: ARCHITECTURE

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         TeamFlow                            │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Frontend   │         │   Backend    │                │
│  │              │         │              │                │
│  │  Settings UI │────────▶│  Slack API   │                │
│  │  Connect Btn │  HTTP   │  Routes      │                │
│  └──────────────┘         └──────┬───────┘                │
│                                   │                         │
│                                   ▼                         │
│                          ┌──────────────┐                  │
│                          │   Slack      │                  │
│                          │   Service    │                  │
│                          └──────┬───────┘                  │
│                                 │                           │
│              ┌──────────────────┼──────────────────┐       │
│              ▼                  ▼                  ▼       │
│     ┌────────────────┐  ┌────────────────┐  ┌──────────┐ │
│     │  OAuth Handler │  │  Notification  │  │ Message  │ │
│     │                │  │    Engine      │  │ Builder  │ │
│     └────────┬───────┘  └────────┬───────┘  └────┬─────┘ │
│              │                   │                 │       │
└──────────────┼───────────────────┼─────────────────┼───────┘
               │                   │                 │
               ▼                   ▼                 ▼
        ┌─────────────────────────────────────────────────┐
        │              Slack API (External)               │
        │                                                 │
        │  ┌─────────────┐  ┌──────────────┐            │
        │  │   OAuth 2.0 │  │  Web API     │            │
        │  │   Endpoint  │  │  chat.post   │            │
        │  └─────────────┘  └──────────────┘            │
        │                                                 │
        │  ┌─────────────┐  ┌──────────────┐            │
        │  │ Interactions│  │  Users/       │            │
        │  │  Endpoint   │  │  Channels API│            │
        │  └─────────────┘  └──────────────┘            │
        └─────────────────────────────────────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │  Slack Workspace │
                     │                  │
                     │  - DMs to users  │
                     │  - Channel posts │
                     └──────────────────┘
```

### Component Design

#### 1. Slack Service (`apps/api/src/services/slack.service.ts`)

```typescript
interface SlackService {
  // OAuth
  getOAuthUrl(workspaceId: string): Promise<string>
  exchangeCodeForToken(code: string, state: string): Promise<SlackIntegration>
  revokeAccess(integrationId: string): Promise<void>

  // Channels
  listChannels(integrationId: string): Promise<SlackChannel[]>
  getChannelInfo(integrationId: string, channelId: string): Promise<SlackChannel>

  // Messaging
  sendDirectMessage(integrationId: string, slackUserId: string, message: SlackMessage): Promise<void>
  sendChannelMessage(integrationId: string, channelId: string, message: SlackMessage): Promise<void>

  // User mapping
  findSlackUserByEmail(integrationId: string, email: string): Promise<SlackUser | null>

  // Utilities
  buildTaskAssignmentMessage(task: Task, assignee: User): SlackMessage
  buildStatusChangeMessage(task: Task, oldStatus: string, newStatus: string): SlackMessage
  buildMentionMessage(task: Task, comment: Comment, mentionedUser: User): SlackMessage
  buildDueDateReminderMessage(task: Task): SlackMessage
}
```

#### 2. Slack Notification Engine (`apps/api/src/modules/slack/slack.notifications.ts`)

```typescript
class SlackNotificationEngine {
  // Event handlers (called from existing notification system)
  async onTaskAssigned(event: TaskAssignedEvent): Promise<void>
  async onStatusChanged(event: StatusChangedEvent): Promise<void>
  async onUserMentioned(event: UserMentionedEvent): Promise<void>
  async onDueDateApproaching(event: DueDateEvent): Promise<void>
  async onSprintStarted(event: SprintEvent): Promise<void>
  async onSprintCompleted(event: SprintEvent): Promise<void>

  // Helper methods
  private shouldNotifyUser(userId: string, eventType: string): Promise<boolean>
  private getUserPreferences(userId: string, integrationId: string): Promise<SlackUserPreference>
  private isQuietHours(preferences: SlackUserPreference): boolean
  private queueDigestNotification(userId: string, notification: Notification): Promise<void>
}
```

#### 3. Slack Message Builder

```typescript
interface SlackMessage {
  channel?: string    // Channel ID or user ID
  text: string       // Fallback text
  blocks: Block[]    // Rich message blocks
  attachments?: Attachment[]
}

interface Block {
  type: "section" | "divider" | "actions" | "context"
  text?: {
    type: "mrkdwn" | "plain_text"
    text: string
  }
  fields?: Array<{ type: string, text: string }>
  elements?: Element[]
}

interface Element {
  type: "button" | "static_select" | "datepicker"
  text: { type: string, text: string }
  action_id: string
  value?: string
  url?: string
  style?: "primary" | "danger"
}

// Example: Task assignment message
function buildTaskAssignmentMessage(task: Task, assignee: User): SlackMessage {
  return {
    text: `You've been assigned to: ${task.title}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New Task Assigned* 🎯\n\n*${task.title}*\n${task.description || 'No description'}`
        }
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Priority: ${task.priority}` },
          { type: "mrkdwn", text: `Project: ${task.project.name}` },
          { type: "mrkdwn", text: `Due: ${formatDate(task.dueDate)}` }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Task" },
            url: `${FRONTEND_URL}/tasks/${task.id}`,
            style: "primary"
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Mark as Done" },
            action_id: "mark_task_done",
            value: task.id
          }
        ]
      }
    ]
  }
}
```

### Database Schema Updates

```sql
-- Migration: Add Slack integration tables

-- 1. SlackIntegration table
CREATE TABLE "SlackIntegration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL UNIQUE,
  "accessToken" TEXT NOT NULL,
  "botUserId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "teamName" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "defaultChannelId" TEXT,
  "defaultChannelName" TEXT,
  "installedBy" TEXT NOT NULL,
  "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SlackIntegration_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE,
  CONSTRAINT "SlackIntegration_installedBy_fkey"
    FOREIGN KEY ("installedBy") REFERENCES "User"("id") ON DELETE RESTRICT
);

CREATE INDEX "SlackIntegration_workspaceId_idx" ON "SlackIntegration"("workspaceId");
CREATE INDEX "SlackIntegration_teamId_idx" ON "SlackIntegration"("teamId");

-- 2. SlackChannelMapping table
CREATE TABLE "SlackChannelMapping" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "integrationId" TEXT NOT NULL,
  "projectId" TEXT,
  "channelId" TEXT NOT NULL,
  "channelName" TEXT NOT NULL,
  "channelType" TEXT NOT NULL,
  "notifyOnAssignment" BOOLEAN NOT NULL DEFAULT true,
  "notifyOnStatusChange" BOOLEAN NOT NULL DEFAULT true,
  "notifyOnComment" BOOLEAN NOT NULL DEFAULT true,
  "notifyOnDueDate" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SlackChannelMapping_integrationId_fkey"
    FOREIGN KEY ("integrationId") REFERENCES "SlackIntegration"("id") ON DELETE CASCADE,
  CONSTRAINT "SlackChannelMapping_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  CONSTRAINT "SlackChannelMapping_unique"
    UNIQUE ("integrationId", "channelId")
);

CREATE INDEX "SlackChannelMapping_projectId_idx" ON "SlackChannelMapping"("projectId");

-- 3. SlackUserPreference table
CREATE TABLE "SlackUserPreference" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "integrationId" TEXT NOT NULL,
  "slackUserId" TEXT,
  "slackUserName" TEXT,
  "enableDMs" BOOLEAN NOT NULL DEFAULT true,
  "enableChannelPosts" BOOLEAN NOT NULL DEFAULT true,
  "frequency" TEXT NOT NULL DEFAULT 'instant',
  "notifyOnAssignment" BOOLEAN NOT NULL DEFAULT true,
  "notifyOnMention" BOOLEAN NOT NULL DEFAULT true,
  "notifyOnStatusChange" BOOLEAN NOT NULL DEFAULT true,
  "notifyOnComment" BOOLEAN NOT NULL DEFAULT false,
  "notifyOnDueDate" BOOLEAN NOT NULL DEFAULT true,
  "quietHoursStart" TEXT,
  "quietHoursEnd" TEXT,
  "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SlackUserPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "SlackUserPreference_integrationId_fkey"
    FOREIGN KEY ("integrationId") REFERENCES "SlackIntegration"("id") ON DELETE CASCADE,
  CONSTRAINT "SlackUserPreference_unique"
    UNIQUE ("userId", "integrationId")
);

CREATE INDEX "SlackUserPreference_slackUserId_idx" ON "SlackUserPreference"("slackUserId");
```

### Security Considerations

#### 1. Token Storage
- **Encryption**: Encrypt Slack access tokens at rest
- **Rotation**: Support token refresh (if Slack provides)
- **Revocation**: Delete tokens on disconnect

#### 2. OAuth Security
- **State parameter**: CSRF protection with random state
- **HTTPS only**: All OAuth redirects over HTTPS
- **Scope validation**: Request minimal required scopes

#### 3. Webhook Security
- **Signature verification**: Verify Slack request signatures
- **Replay protection**: Check timestamp headers
- **Rate limiting**: Prevent abuse of webhook endpoints

#### 4. Authorization
- **Workspace isolation**: Only send notifications within workspace
- **User permissions**: Respect TeamFlow RBAC rules
- **Channel access**: Verify bot has channel permissions

---

## 💻 PHASE 4: DEVELOP

### Week 1: Backend Foundation (5 days)

#### Day 1-2: OAuth Flow & Database
- ✅ Create Slack App in Slack API portal
- ✅ Add Prisma schema for Slack tables
- ✅ Generate and run database migration
- ✅ Implement OAuth routes:
  - `GET /oauth/start` - Generate OAuth URL
  - `GET /oauth/callback` - Handle callback
- ✅ Implement token encryption/decryption
- ✅ Create SlackService basic structure

#### Day 3: Slack API Integration
- ✅ Install `@slack/web-api` package
- ✅ Implement Slack Web API client wrapper
- ✅ Implement channel listing
- ✅ Implement user lookup by email
- ✅ Test API connectivity

#### Day 4: Message Builder
- ✅ Create Slack message builder utilities
- ✅ Implement block builders for:
  - Task assignment
  - Status change
  - Mentions
  - Due date reminders
- ✅ Add interactive button support
- ✅ Test message formatting

#### Day 5: Configuration Endpoints
- ✅ Implement integration CRUD endpoints
- ✅ Implement channel mapping endpoints
- ✅ Implement user preference endpoints
- ✅ Add validation and error handling
- ✅ Test all endpoints with Postman

### Week 2: Notifications & Frontend (5 days)

#### Day 6: Notification Engine
- ✅ Create SlackNotificationEngine
- ✅ Integrate with existing notification system
- ✅ Implement event handlers:
  - Task assigned
  - Status changed
  - User mentioned
  - Due date approaching
- ✅ Add preference checking logic
- ✅ Add quiet hours support

#### Day 7: Interactive Buttons & Webhooks
- ✅ Implement webhook endpoint for interactions
- ✅ Handle button clicks:
  - View task (URL button)
  - Mark as done (action button)
- ✅ Add signature verification
- ✅ Update task status from Slack action

#### Day 8-9: Frontend UI
- ✅ Create Slack integration settings page
- ✅ Build "Connect Slack" button
- ✅ Build channel mapping UI
- ✅ Build user preference form
- ✅ Add connection status display
- ✅ Add disconnect functionality
- ✅ Style with TailwindCSS

#### Day 10: Testing & Polish
- ✅ End-to-end testing:
  - OAuth flow
  - All notification types
  - User preferences
  - Channel mappings
- ✅ Error handling improvements
- ✅ Loading states and feedback
- ✅ Documentation updates
- ✅ Code cleanup and review

---

## 📋 Implementation Checklist

### Backend Tasks

#### Slack Service
- [ ] Create `apps/api/src/services/slack.service.ts`
- [ ] Install `@slack/web-api` and `@slack/oauth` packages
- [ ] Implement OAuth URL generation
- [ ] Implement token exchange
- [ ] Implement token encryption (AES-256)
- [ ] Implement channel listing
- [ ] Implement user lookup
- [ ] Implement message sending (DM & channel)
- [ ] Implement message builder functions

#### API Routes
- [ ] Create `apps/api/src/modules/slack/` directory
- [ ] Create `slack.types.ts` - TypeScript interfaces
- [ ] Create `slack.controller.ts` - Request handlers
- [ ] Create `slack.routes.ts` - Route definitions
- [ ] Create `slack.notifications.ts` - Notification engine
- [ ] Register routes in `apps/api/src/index.ts`

#### Database
- [ ] Update `packages/database/prisma/schema.prisma`
- [ ] Create migration for Slack tables
- [ ] Run migration
- [ ] Test schema with Prisma Studio

#### Integration with Existing Systems
- [ ] Hook into notification service
- [ ] Add Slack event listeners
- [ ] Update task service to trigger Slack notifications
- [ ] Update comment service for mention notifications

### Frontend Tasks

#### Components
- [ ] Create `apps/web/src/components/slack/` directory
- [ ] Create `SlackConnectionCard.tsx` - Connection status
- [ ] Create `SlackChannelMapping.tsx` - Channel settings
- [ ] Create `SlackUserPreferences.tsx` - User settings
- [ ] Create `SlackSetupWizard.tsx` - Initial setup flow

#### Pages
- [ ] Create `apps/web/src/app/(dashboard)/[workspaceId]/settings/integrations/page.tsx`
- [ ] Update navigation to include integrations link
- [ ] Add Slack icon and branding

#### API Client
- [ ] Create `apps/web/src/lib/api/slack.ts`
- [ ] Add React Query hooks for Slack endpoints
- [ ] Add error handling and loading states

### Environment Variables
- [ ] `SLACK_CLIENT_ID` - From Slack app
- [ ] `SLACK_CLIENT_SECRET` - From Slack app
- [ ] `SLACK_REDIRECT_URI` - OAuth callback URL
- [ ] `SLACK_SIGNING_SECRET` - For webhook verification
- [ ] `ENCRYPTION_KEY` - For token encryption (32 bytes)

---

## 🧪 Testing Strategy

### Unit Tests
- SlackService methods (OAuth, messaging, user lookup)
- Message builder functions
- Notification engine event handlers
- Preference checking logic

### Integration Tests
- OAuth flow end-to-end
- Notification sending to Slack
- Channel mapping creation/update
- User preference updates
- Interactive button handling

### Manual Testing Scenarios

#### Scenario 1: First-time Setup
1. Fresh workspace (no Slack integration)
2. Admin clicks "Connect Slack"
3. Completes OAuth flow
4. Selects default channel
5. Verifies connection status

#### Scenario 2: Task Assignment Notification
1. PM assigns task to user
2. User receives Slack DM
3. Clicks "View Task" button
4. Opens TeamFlow in browser
5. Verifies task details

#### Scenario 3: Interactive Button
1. User receives task notification
2. Clicks "Mark as Done" in Slack
3. Task status updates in TeamFlow
4. Slack message updates to show "✅ Completed"

#### Scenario 4: Preference Customization
1. User opens Slack preferences
2. Changes frequency to "Daily digest"
3. Assigns new task to user
4. Notification queued (not sent immediately)
5. Daily digest sent at configured time

---

## 📊 Success Metrics

### Technical Metrics
- OAuth success rate: >95%
- Notification delivery time: <5 seconds
- Interactive button response: <2 seconds
- API error rate: <1%

### User Metrics
- Workspaces connected: Track adoption
- Notifications sent: Volume per day
- Button clicks: Engagement rate
- User preferences set: Customization rate

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Create Slack App in Slack API portal
- [ ] Configure OAuth redirect URLs
- [ ] Add required scopes
- [ ] Enable interactive messages
- [ ] Set up request URL for interactions
- [ ] Copy client ID, secret, signing secret

### Environment Setup
- [ ] Add Slack environment variables to `.env`
- [ ] Add encryption key for token storage
- [ ] Configure redirect URI for production

### Database Migration
- [ ] Run Slack integration migration in production
- [ ] Verify tables created correctly
- [ ] Check indexes

### Deployment
- [ ] Deploy backend with new Slack endpoints
- [ ] Deploy frontend with Slack UI
- [ ] Test OAuth flow in production
- [ ] Send test notifications
- [ ] Verify interactive buttons work

### Monitoring
- [ ] Set up logging for Slack events
- [ ] Monitor OAuth success/failure
- [ ] Track notification delivery
- [ ] Alert on high error rates

---

## 🔮 Future Enhancements (Phase 2)

### Advanced Features
1. **Slack Commands**: `/teamflow create task "Fix bug"`
2. **Bidirectional Sync**: Update tasks from Slack
3. **Thread Sync**: Slack threads ↔ TeamFlow comments
4. **Rich Previews**: Unfurl TeamFlow task links in Slack
5. **Status Reports**: Daily/weekly team summaries
6. **Workflow Automation**: Slack triggers for workflows
7. **Multi-workspace**: Connect multiple Slack workspaces
8. **Analytics Dashboard**: Slack engagement metrics

---

## 📚 Resources

### Slack API Documentation
- OAuth Guide: https://api.slack.com/authentication/oauth-v2
- Web API: https://api.slack.com/web
- Block Kit: https://api.slack.com/block-kit
- Interactive Messages: https://api.slack.com/interactivity

### Libraries
- `@slack/web-api`: Official Slack Web API client
- `@slack/oauth`: OAuth 2.0 helper
- `crypto`: Node.js encryption for tokens

---

**Status**: 🟡 Ready to start development
**Next Step**: Day 1 - Create Slack App & OAuth setup

---

*This implementation plan follows the BMAD methodology and provides a complete roadmap for implementing Slack integration in TeamFlow.*
