# Slack Integration - Database Schema

**Status**: ✅ Completed
**Date**: October 22, 2025

---

## Overview

The Slack integration database schema has been successfully added to TeamFlow. This schema supports OAuth authentication, channel mappings, and user preferences for Slack notifications.

---

## Database Models Added

### 1. SlackIntegration

Stores the connection between a TeamFlow workspace and a Slack workspace.

**Table**: `slack_integrations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | Foreign key to Workspace (unique) |
| `accessToken` | String | Encrypted Slack OAuth access token |
| `botUserId` | String | Slack bot user ID (e.g., U01234567) |
| `teamId` | String | Slack team/workspace ID (e.g., T01234567) |
| `teamName` | String | Slack workspace name |
| `isActive` | Boolean | Whether integration is active (default: true) |
| `defaultChannelId` | String? | Default Slack channel ID for workspace updates |
| `defaultChannelName` | String? | Default Slack channel name |
| `installedBy` | UUID | User who installed the integration |
| `installedAt` | DateTime | Installation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**:
- `workspaceId` - For quick workspace lookup
- `teamId` - For Slack team lookups

**Relations**:
- `workspace` → Workspace (one-to-one)
- `installedByUser` → User
- `channelMappings` → SlackChannelMapping[] (one-to-many)
- `userPreferences` → SlackUserPreference[] (one-to-many)

---

### 2. SlackChannelMapping

Maps Slack channels to TeamFlow projects with notification settings.

**Table**: `slack_channel_mappings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `integrationId` | UUID | Foreign key to SlackIntegration |
| `projectId` | UUID? | Optional foreign key to Project |
| `channelId` | String | Slack channel ID (e.g., C01234567) |
| `channelName` | String | Slack channel name (e.g., #general) |
| `channelType` | String | Channel type: "public", "private", "dm" |
| `notifyOnAssignment` | Boolean | Send task assignment notifications (default: true) |
| `notifyOnStatusChange` | Boolean | Send status change notifications (default: true) |
| `notifyOnComment` | Boolean | Send comment notifications (default: true) |
| `notifyOnDueDate` | Boolean | Send due date reminders (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**:
- `projectId` - For project-based channel lookups
- `(integrationId, channelId)` - Unique constraint

**Relations**:
- `integration` → SlackIntegration
- `project` → Project (optional)

---

### 3. SlackUserPreference

Stores per-user notification preferences for Slack.

**Table**: `slack_user_preferences`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `userId` | UUID | Foreign key to User |
| `integrationId` | UUID | Foreign key to SlackIntegration |
| `slackUserId` | String? | Slack user ID (e.g., U01234567) |
| `slackUserName` | String? | Slack display name |
| `enableDMs` | Boolean | Receive personal DMs (default: true) |
| `enableChannelPosts` | Boolean | See in channel posts (default: true) |
| `frequency` | String | Notification frequency: "instant", "hourly", "daily", "disabled" (default: "instant") |
| `notifyOnAssignment` | Boolean | Get notified on task assignments (default: true) |
| `notifyOnMention` | Boolean | Get notified on mentions (default: true) |
| `notifyOnStatusChange` | Boolean | Get notified on status changes (default: true) |
| `notifyOnComment` | Boolean | Get notified on comments (default: false) |
| `notifyOnDueDate` | Boolean | Get notified on due dates (default: true) |
| `quietHoursStart` | String? | Quiet hours start time (e.g., "22:00") |
| `quietHoursEnd` | String? | Quiet hours end time (e.g., "08:00") |
| `quietHoursEnabled` | Boolean | Enable quiet hours (default: false) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes**:
- `slackUserId` - For Slack user lookups
- `(userId, integrationId)` - Unique constraint

**Relations**:
- `user` → User
- `integration` → SlackIntegration

---

## Schema Updates to Existing Models

### User Model

Added relations:
- `slackIntegrations` → SlackIntegration[] (installations they created)
- `slackPreferences` → SlackUserPreference[] (their notification preferences)

### Workspace Model

Added relation:
- `slackIntegration` → SlackIntegration? (one-to-one, optional)

### Project Model

Added relation:
- `slackChannelMappings` → SlackChannelMapping[] (mapped Slack channels)

### Task Model

Added field:
- `searchVector` → String? (@db.Text) - PostgreSQL tsvector for full-text search (from previous search feature)

---

## Database Migration

### Migration Method

Used `npx prisma db push` for development to apply schema changes directly to the database.

### Tables Created

```sql
CREATE TABLE "slack_integrations" (
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

  CONSTRAINT "slack_integrations_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "slack_integrations_installedBy_fkey"
    FOREIGN KEY ("installedBy") REFERENCES "users"("id")
);

CREATE INDEX "slack_integrations_workspaceId_idx" ON "slack_integrations"("workspaceId");
CREATE INDEX "slack_integrations_teamId_idx" ON "slack_integrations"("teamId");

CREATE TABLE "slack_channel_mappings" (
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

  CONSTRAINT "slack_channel_mappings_integrationId_fkey"
    FOREIGN KEY ("integrationId") REFERENCES "slack_integrations"("id") ON DELETE CASCADE,
  CONSTRAINT "slack_channel_mappings_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "slack_channel_mappings_unique"
    UNIQUE ("integrationId", "channelId")
);

CREATE INDEX "slack_channel_mappings_projectId_idx" ON "slack_channel_mappings"("projectId");

CREATE TABLE "slack_user_preferences" (
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

  CONSTRAINT "slack_user_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "slack_user_preferences_integrationId_fkey"
    FOREIGN KEY ("integrationId") REFERENCES "slack_integrations"("id") ON DELETE CASCADE,
  CONSTRAINT "slack_user_preferences_unique"
    UNIQUE ("userId", "integrationId")
);

CREATE INDEX "slack_user_preferences_slackUserId_idx" ON "slack_user_preferences"("slackUserId");
```

---

## Security Considerations

### Token Encryption

The `accessToken` field stores Slack OAuth tokens. **These MUST be encrypted** before storing in the database.

**Implementation Requirements**:
1. Use AES-256-GCM encryption
2. Store encryption key in environment variable `ENCRYPTION_KEY`
3. Never log or expose decrypted tokens
4. Encrypt on write, decrypt on read

**Example** (to be implemented):
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(encrypted: string): string {
  const [iv, authTag, content] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return decipher.update(Buffer.from(content, 'hex')) + decipher.final('utf8');
}
```

---

## Data Relationships

```
Workspace (1) ←→ (1) SlackIntegration
                     ↓ (1:many)
             SlackChannelMapping
                     ↓ (optional)
                  Project

User (1) → (many) SlackUserPreference
               ↓
         SlackIntegration
```

---

## Next Steps

1. ✅ Database schema created
2. ✅ Tables added to PostgreSQL
3. ⏳ Install Slack SDK packages (`@slack/web-api`, `@slack/oauth`)
4. ⏳ Implement OAuth flow
5. ⏳ Implement Slack service layer
6. ⏳ Create API routes
7. ⏳ Build notification engine
8. ⏳ Build frontend UI

---

## Files Modified

- ✅ [packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)
  - Added SlackIntegration model
  - Added SlackChannelMapping model
  - Added SlackUserPreference model
  - Updated User, Workspace, Project models with relations
  - Added searchVector field to Task model

---

## Prisma Client Generation

**Note**: Prisma client generation encountered a Windows file locking issue (EPERM). This is a known Windows issue and doesn't affect the database schema. The schema has been successfully applied to the database.

**To regenerate** (after resolving file locks):
```bash
cd packages/database
npx prisma generate
```

---

**Status**: ✅ Database schema implementation complete
**Next**: Install Slack SDK packages and implement OAuth flow

