# Slack Integration - API Routes Documentation

**Status**: ✅ **COMPLETED**
**Date**: October 22, 2025
**Total Endpoints**: 14

---

## 📋 Overview

Complete REST API for Slack integration, including OAuth flow, channel management, user preferences, and webhook handling.

**Base URL**: `http://localhost:4000/api/slack`

---

## 🔐 Authentication

Most endpoints require JWT authentication via `Authorization: Bearer <token>` header.

**Exceptions** (Public endpoints):
- `GET /oauth/callback` - Slack OAuth redirect
- `POST /webhook/interactions` - Slack webhook (signature verified)
- `POST /webhook/commands` - Slack webhook (signature verified)

---

## 📚 API Endpoints

### 1. OAuth & Setup

#### **GET** `/oauth/start`
Initiate Slack OAuth flow

**Auth**: Required (OWNER/ADMIN)
**Query Parameters**:
- `workspaceId` (required) - TeamFlow workspace ID

**Response**: `200 OK`
```json
{
  "data": {
    "authUrl": "https://slack.com/oauth/v2/authorize?..."
  }
}
```

**Errors**:
- `400` - Missing workspace ID
- `403` - User not authorized for workspace

---

#### **GET** `/oauth/callback`
Handle Slack OAuth callback (redirects to frontend)

**Auth**: Public
**Query Parameters**:
- `code` (required) - OAuth authorization code
- `state` (required) - OAuth state parameter

**Response**: Redirect to `${FRONTEND_URL}/slack/callback?code=xxx&state=xxx`

---

#### **POST** `/oauth/complete`
Complete OAuth flow (called by frontend)

**Auth**: Required (OWNER/ADMIN)
**Body**:
```json
{
  "code": "string",
  "state": "string",
  "workspaceId": "uuid"
}
```

**Response**: `200 OK`
```json
{
  "message": "Slack workspace connected successfully",
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "botUserId": "U01234567",
    "teamId": "T01234567",
    "teamName": "Acme Corp",
    "isActive": true,
    "installedAt": "2025-10-22T12:00:00Z",
    "installedByUser": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Errors**:
- `400` - Invalid OAuth code or missing parameters
- `403` - User not authorized for workspace

---

### 2. Integration Management

#### **GET** `/integration/:workspaceId`
Get Slack integration status

**Auth**: Required
**Params**:
- `workspaceId` (UUID) - TeamFlow workspace ID

**Response**: `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "botUserId": "U01234567",
    "teamId": "T01234567",
    "teamName": "Acme Corp",
    "isActive": true,
    "defaultChannelId": "C01234567",
    "defaultChannelName": "#general",
    "installedAt": "2025-10-22T12:00:00Z",
    "workspace": {
      "id": "uuid",
      "name": "My Workspace",
      "slug": "my-workspace"
    },
    "installedByUser": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "channelMappings": [
      {
        "id": "uuid",
        "channelId": "C01234567",
        "channelName": "#engineering",
        "projectId": "uuid",
        "project": {
          "id": "uuid",
          "name": "TeamFlow"
        },
        "notifyOnAssignment": true,
        "notifyOnStatusChange": true,
        "notifyOnComment": true,
        "notifyOnDueDate": true
      }
    ]
  }
}
```

**Errors**:
- `403` - User not authorized for workspace
- `404` - Integration not found

---

#### **PATCH** `/integration/:integrationId`
Update integration settings

**Auth**: Required (OWNER/ADMIN)
**Params**:
- `integrationId` (UUID) - Slack integration ID

**Body**:
```json
{
  "defaultChannelId": "C01234567",
  "defaultChannelName": "#general",
  "isActive": true
}
```

**Response**: `200 OK`
```json
{
  "message": "Integration settings updated",
  "data": {
    "id": "uuid",
    "defaultChannelId": "C01234567",
    "defaultChannelName": "#general",
    "isActive": true,
    ...
  }
}
```

**Errors**:
- `403` - User not authorized
- `404` - Integration not found

---

#### **DELETE** `/integration/:integrationId`
Disconnect Slack integration

**Auth**: Required (OWNER/ADMIN)
**Params**:
- `integrationId` (UUID) - Slack integration ID

**Response**: `200 OK`
```json
{
  "message": "Slack integration disconnected successfully"
}
```

**Errors**:
- `403` - User not authorized
- `500` - Failed to revoke Slack token

---

### 3. Channel Management

#### **GET** `/integration/:integrationId/channels`
List available Slack channels

**Auth**: Required
**Params**:
- `integrationId` (UUID) - Slack integration ID

**Query Parameters**:
- `cursor` (optional) - Pagination cursor

**Response**: `200 OK`
```json
{
  "data": {
    "channels": [
      {
        "id": "C01234567",
        "name": "general",
        "is_channel": true,
        "is_private": false,
        "is_archived": false,
        "is_member": true,
        "num_members": 25
      },
      {
        "id": "C98765432",
        "name": "engineering",
        "is_channel": true,
        "is_private": true,
        "is_archived": false,
        "is_member": true,
        "num_members": 10
      }
    ],
    "nextCursor": "dXNlcjpVMEc5V0ZYTlo="
  }
}
```

**Errors**:
- `403` - User not authorized
- `404` - Integration not found

---

#### **POST** `/integration/:integrationId/channels`
Create channel mapping

**Auth**: Required (OWNER/ADMIN)
**Params**:
- `integrationId` (UUID) - Slack integration ID

**Body**:
```json
{
  "channelId": "C01234567",
  "channelName": "#engineering",
  "projectId": "uuid",
  "notifyOnAssignment": true,
  "notifyOnStatusChange": true,
  "notifyOnComment": true,
  "notifyOnDueDate": true
}
```

**Response**: `201 Created`
```json
{
  "message": "Channel mapping created",
  "data": {
    "id": "uuid",
    "integrationId": "uuid",
    "channelId": "C01234567",
    "channelName": "#engineering",
    "channelType": "public",
    "projectId": "uuid",
    "project": {
      "id": "uuid",
      "name": "TeamFlow"
    },
    "notifyOnAssignment": true,
    "notifyOnStatusChange": true,
    "notifyOnComment": true,
    "notifyOnDueDate": true,
    "createdAt": "2025-10-22T12:00:00Z"
  }
}
```

**Errors**:
- `400` - Invalid project ID or validation error
- `403` - User not authorized
- `409` - Channel already mapped

---

#### **PATCH** `/channels/:mappingId`
Update channel mapping settings

**Auth**: Required (OWNER/ADMIN)
**Params**:
- `mappingId` (UUID) - Channel mapping ID

**Body**:
```json
{
  "notifyOnAssignment": false,
  "notifyOnStatusChange": true,
  "notifyOnComment": false,
  "notifyOnDueDate": true
}
```

**Response**: `200 OK`
```json
{
  "message": "Channel mapping updated",
  "data": {
    "id": "uuid",
    "notifyOnAssignment": false,
    "notifyOnStatusChange": true,
    ...
  }
}
```

**Errors**:
- `403` - User not authorized
- `404` - Mapping not found

---

#### **DELETE** `/channels/:mappingId`
Delete channel mapping

**Auth**: Required (OWNER/ADMIN)
**Params**:
- `mappingId` (UUID) - Channel mapping ID

**Response**: `200 OK`
```json
{
  "message": "Channel mapping deleted"
}
```

**Errors**:
- `403` - User not authorized
- `404` - Mapping not found

---

### 4. User Preferences

#### **GET** `/integration/:integrationId/preferences`
Get user's Slack notification preferences

**Auth**: Required
**Params**:
- `integrationId` (UUID) - Slack integration ID

**Response**: `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "integrationId": "uuid",
    "slackUserId": "U01234567",
    "slackUserName": "johndoe",
    "enableDMs": true,
    "enableChannelPosts": true,
    "frequency": "instant",
    "notifyOnAssignment": true,
    "notifyOnMention": true,
    "notifyOnStatusChange": true,
    "notifyOnComment": false,
    "notifyOnDueDate": true,
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "createdAt": "2025-10-22T12:00:00Z",
    "updatedAt": "2025-10-22T15:30:00Z"
  }
}
```

**Note**: If preferences don't exist, they are automatically created with defaults.

**Errors**:
- `403` - User not authorized
- `404` - Integration not found

---

#### **PATCH** `/integration/:integrationId/preferences`
Update user's Slack notification preferences

**Auth**: Required
**Params**:
- `integrationId` (UUID) - Slack integration ID

**Body**:
```json
{
  "enableDMs": true,
  "enableChannelPosts": false,
  "frequency": "daily",
  "notifyOnAssignment": true,
  "notifyOnMention": true,
  "notifyOnStatusChange": false,
  "notifyOnComment": false,
  "notifyOnDueDate": true,
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

**Validation**:
- `frequency`: Must be one of `["instant", "hourly", "daily", "disabled"]`
- `quietHours.start` / `end`: Must match format `HH:MM` (24-hour)

**Response**: `200 OK`
```json
{
  "message": "Preferences updated",
  "data": {
    "id": "uuid",
    "enableDMs": true,
    "frequency": "daily",
    ...
  }
}
```

**Errors**:
- `400` - Validation error
- `403` - User not authorized

---

### 5. Webhooks (for Slack to call)

#### **POST** `/webhook/interactions`
Handle interactive message callbacks (button clicks)

**Auth**: Public (verified via Slack signature)
**Headers**:
- `x-slack-signature` - Slack request signature
- `x-slack-request-timestamp` - Request timestamp

**Body**: (Form-encoded by Slack)
```json
{
  "payload": {
    "type": "block_actions",
    "user": {
      "id": "U01234567",
      "name": "johndoe"
    },
    "actions": [
      {
        "action_id": "mark_task_done",
        "value": "task-uuid"
      }
    ],
    "channel": {
      "id": "C01234567"
    },
    "container": {
      "message_ts": "1234567890.123456"
    }
  }
}
```

**Response**: `200 OK`
```json
{
  "response_type": "ephemeral",
  "text": "✅ Task \"Fix bug\" marked as done!"
}
```

**Errors**:
- `401` - Invalid Slack signature

---

#### **POST** `/webhook/commands`
Handle Slack slash commands (future feature)

**Auth**: Public (verified via Slack signature)
**Body**:
```json
{
  "command": "/teamflow",
  "text": "create task \"Fix bug\"",
  "user_id": "U01234567",
  "team_id": "T01234567"
}
```

**Response**: `200 OK`
```json
{
  "response_type": "ephemeral",
  "text": "Slash commands coming soon! 🚀"
}
```

---

## 🔒 Security

### Authentication
- **JWT Required**: Most endpoints require valid JWT token
- **Role-Based Access**: OWNER/ADMIN required for sensitive operations
- **Workspace Isolation**: Users can only access their workspace integrations

### Webhook Security
- **Signature Verification**: All webhook requests verified using HMAC-SHA256
- **Replay Protection**: Requests older than 5 minutes are rejected
- **Timing-Safe Comparison**: Signatures compared using constant-time algorithm

---

## 📝 Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters or validation error |
| `401` | Unauthorized - Missing or invalid authentication |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Duplicate resource (e.g., channel already mapped) |
| `500` | Internal Server Error - Something went wrong |

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Set environment variables
export TOKEN="your-jwt-token"
export WORKSPACE_ID="your-workspace-id"
export INTEGRATION_ID="slack-integration-id"

# 1. Start OAuth flow
curl -X GET "http://localhost:4000/api/slack/oauth/start?workspaceId=$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN"

# 2. Get integration status
curl -X GET "http://localhost:4000/api/slack/integration/$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN"

# 3. List channels
curl -X GET "http://localhost:4000/api/slack/integration/$INTEGRATION_ID/channels" \
  -H "Authorization: Bearer $TOKEN"

# 4. Create channel mapping
curl -X POST "http://localhost:4000/api/slack/integration/$INTEGRATION_ID/channels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "C01234567",
    "channelName": "#engineering",
    "notifyOnAssignment": true
  }'

# 5. Update user preferences
curl -X PATCH "http://localhost:4000/api/slack/integration/$INTEGRATION_ID/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "frequency": "daily",
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    }
  }'

# 6. Disconnect integration
curl -X DELETE "http://localhost:4000/api/slack/integration/$INTEGRATION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Files

```
apps/api/src/modules/slack/
├── slack.controller.ts      # Request handlers
├── slack.routes.ts          # Route definitions
├── slack.webhook.ts         # Webhook handlers
├── slack.types.ts           # TypeScript types + Zod schemas
└── slack.messages.ts        # Message builders
```

---

## 🎯 Next Steps

1. **Frontend Integration**:
   - Create Slack settings page
   - Build channel mapping UI
   - Add user preferences form

2. **Notification Engine**:
   - Hook into task events
   - Implement preference checking
   - Add quiet hours logic

3. **Testing**:
   - Write integration tests
   - Test OAuth flow end-to-end
   - Test interactive buttons

---

**Status**: ✅ **API Routes Complete**
**Total Lines**: ~1,500 lines of code
**Test Coverage**: Ready for manual and automated testing

