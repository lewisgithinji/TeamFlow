# TeamFlow REST API Contracts

Complete API specification for TeamFlow backend services.

**Base URL**: `https://api.teamflow.app/v1`

**API Version**: 1.0

## Table of Contents
1. [Authentication Endpoints](#1-authentication-endpoints)
2. [User Endpoints](#2-user-endpoints)
3. [Workspace Endpoints](#3-workspace-endpoints)
4. [Project Endpoints](#4-project-endpoints)
5. [Task Endpoints](#5-task-endpoints)
6. [Sprint Endpoints](#6-sprint-endpoints)
7. [Comment Endpoints](#7-comment-endpoints)
8. [Analytics Endpoints](#8-analytics-endpoints)
9. [Integration Endpoints](#9-integration-endpoints)
10. [WebSocket Events](#10-websocket-events)
11. [Common Patterns](#11-common-patterns)

---

## General Information

### Authentication
All authenticated endpoints require a JWT access token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### Rate Limiting
- **Default**: 100 requests per minute per user
- **Auth endpoints**: 10 requests per minute per IP
- **AI endpoints**: 20 requests per hour per workspace

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

### Pagination
List endpoints support cursor-based pagination:
```
GET /api/tasks?limit=20&cursor=eyJpZCI6IjEyMyJ9
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6IjQ1NiJ9",
    "hasMore": true,
    "total": 100
  }
}
```

### Error Response Format
All errors follow this structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_abc123xyz"
  }
}
```

---

## 1. Authentication Endpoints

### 1.1 Register User

**Endpoint**: `POST /api/auth/register`

**Authentication**: Not required

**Permissions**: None

**Description**: Create a new user account with email/password

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Request Schema**:
```typescript
{
  email: string;      // Required, valid email format
  password: string;   // Required, min 8 chars, 1 upper, 1 lower, 1 number
  name: string;       // Required, 2-100 characters
}
```

**Success Response** (201 Created):
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "emailVerified": false,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed",
      "details": [
        {
          "field": "password",
          "message": "Password must contain at least 1 uppercase letter"
        }
      ]
    }
  }
  ```
- **409 Conflict**: Email already registered
  ```json
  {
    "error": {
      "code": "EMAIL_EXISTS",
      "message": "An account with this email already exists"
    }
  }
  ```
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

**Rate Limit**: 5 requests per 15 minutes per IP

---

### 1.2 Login

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Permissions**: None

**Description**: Authenticate user and receive access tokens

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

**Request Schema**:
```typescript
{
  email: string;        // Required
  password: string;     // Required
  rememberMe?: boolean; // Optional, default false
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg",
    "emailVerified": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid request
- **401 Unauthorized**: Invalid credentials
  ```json
  {
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid email or password"
    }
  }
  ```
- **403 Forbidden**: Account locked
  ```json
  {
    "error": {
      "code": "ACCOUNT_LOCKED",
      "message": "Account locked due to too many failed login attempts. Try again in 15 minutes.",
      "lockedUntil": "2025-01-15T11:00:00Z"
    }
  }
  ```
- **403 Forbidden**: Email not verified
  ```json
  {
    "error": {
      "code": "EMAIL_NOT_VERIFIED",
      "message": "Please verify your email before logging in"
    }
  }
  ```
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per hour per IP

---

### 1.3 Refresh Token

**Endpoint**: `POST /api/auth/refresh`

**Authentication**: Not required (uses refresh token)

**Permissions**: None

**Description**: Exchange refresh token for new access token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response** (200 OK):
```json
{
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid or expired refresh token
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 1.4 Logout

**Endpoint**: `POST /api/auth/logout`

**Authentication**: Required

**Permissions**: Authenticated user

**Description**: Invalidate current access and refresh tokens

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per minute per user

---

### 1.5 Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Authentication**: Not required

**Permissions**: None

**Description**: Request password reset email

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200 OK):
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Notes**:
- Always returns success message for security (prevents email enumeration)
- Reset link expires in 1 hour

**Error Responses**:
- **400 Bad Request**: Invalid email format
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

**Rate Limit**: 3 requests per hour per IP

---

### 1.6 Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Authentication**: Not required (uses reset token)

**Permissions**: None

**Description**: Reset password using reset token from email

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Success Response** (200 OK):
```json
{
  "message": "Password reset successful. You can now log in with your new password.",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid password format
- **401 Unauthorized**: Invalid or expired token
- **500 Internal Server Error**: Server error

**Rate Limit**: 5 requests per hour per IP

---

### 1.7 Verify Email

**Endpoint**: `POST /api/auth/verify-email`

**Authentication**: Not required (uses verification token)

**Permissions**: None

**Description**: Verify user email address

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Success Response** (200 OK):
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid or expired token
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per hour per IP

---

### 1.8 OAuth - Google

**Endpoint**: `POST /api/auth/oauth/google`

**Authentication**: Not required

**Permissions**: None

**Description**: Authenticate with Google OAuth

**Request Body**:
```json
{
  "code": "google_auth_code",
  "redirectUri": "https://teamflow.app/auth/callback"
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/...",
    "emailVerified": true,
    "provider": "google"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  },
  "isNewUser": false
}
```

**Error Responses**:
- **400 Bad Request**: Invalid auth code
- **401 Unauthorized**: OAuth authentication failed
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per minute per IP

---

### 1.9 OAuth - GitHub

**Endpoint**: `POST /api/auth/oauth/github`

**Authentication**: Not required

**Permissions**: None

**Description**: Authenticate with GitHub OAuth

**Request Body**:
```json
{
  "code": "github_auth_code",
  "redirectUri": "https://teamflow.app/auth/callback"
}
```

**Success Response**: Same as Google OAuth (200 OK)

**Error Responses**: Same as Google OAuth

**Rate Limit**: 10 requests per minute per IP

---

## 2. User Endpoints

### 2.1 Get Current User

**Endpoint**: `GET /api/users/me`

**Authentication**: Required

**Permissions**: Authenticated user

**Description**: Get current authenticated user's profile

**Query Parameters**: None

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg",
    "emailVerified": true,
    "provider": "email",
    "createdAt": "2025-01-15T10:30:00Z",
    "lastLoginAt": "2025-01-20T08:15:00Z",
    "workspaces": [
      {
        "id": "ws_xyz789",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "role": "owner",
        "logo": "https://cdn.teamflow.app/logos/ws_xyz789.png"
      }
    ]
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid or missing token
- **500 Internal Server Error**: Server error

**Rate Limit**: 60 requests per minute per user

---

### 2.2 Update Current User

**Endpoint**: `PUT /api/users/me`

**Authentication**: Required

**Permissions**: Authenticated user

**Description**: Update current user's profile

**Request Body**:
```json
{
  "name": "John Smith",
  "avatar": "https://cdn.teamflow.app/avatars/new-avatar.jpg"
}
```

**Request Schema**:
```typescript
{
  name?: string;       // Optional, 2-100 characters
  avatar?: string;     // Optional, valid URL
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Smith",
    "avatar": "https://cdn.teamflow.app/avatars/new-avatar.jpg",
    "emailVerified": true,
    "updatedAt": "2025-01-20T09:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 2.3 Get User By ID

**Endpoint**: `GET /api/users/:id`

**Authentication**: Required

**Permissions**: Must share a workspace with target user

**Description**: Get public profile of a user

**Path Parameters**:
- `id` (string, required): User ID

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "usr_abc123",
    "name": "John Doe",
    "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No shared workspace
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 2.4 Delete Account

**Endpoint**: `DELETE /api/users/me`

**Authentication**: Required

**Permissions**: Authenticated user

**Description**: Delete user account (requires password confirmation)

**Request Body**:
```json
{
  "password": "CurrentPassword123!",
  "confirmation": "DELETE"
}
```

**Success Response** (200 OK):
```json
{
  "message": "Account deleted successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Incorrect password or confirmation
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Cannot delete if workspace owner (transfer ownership first)
- **500 Internal Server Error**: Server error

**Rate Limit**: 3 requests per hour per user

---

## 3. Workspace Endpoints

### 3.1 Create Workspace

**Endpoint**: `POST /api/workspaces`

**Authentication**: Required

**Permissions**: Authenticated user

**Description**: Create a new workspace

**Request Body**:
```json
{
  "name": "Acme Corp",
  "description": "Our awesome team workspace",
  "logo": "https://cdn.teamflow.app/logos/acme.png"
}
```

**Request Schema**:
```typescript
{
  name: string;         // Required, 3-50 characters
  description?: string; // Optional, max 500 characters
  logo?: string;        // Optional, valid URL
}
```

**Success Response** (201 Created):
```json
{
  "workspace": {
    "id": "ws_xyz789",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "description": "Our awesome team workspace",
    "logo": "https://cdn.teamflow.app/logos/acme.png",
    "ownerId": "usr_abc123",
    "settings": {
      "defaultRole": "member",
      "allowMemberInvites": false,
      "requireEmailVerification": true,
      "timezone": "America/New_York"
    },
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T10:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **409 Conflict**: Slug already exists
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 workspaces per hour per user

---

### 3.2 List Workspaces

**Endpoint**: `GET /api/workspaces`

**Authentication**: Required

**Permissions**: Authenticated user

**Description**: Get all workspaces user is a member of

**Query Parameters**:
- `limit` (number, optional, default: 20): Results per page
- `cursor` (string, optional): Pagination cursor

**Success Response** (200 OK):
```json
{
  "workspaces": [
    {
      "id": "ws_xyz789",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "logo": "https://cdn.teamflow.app/logos/acme.png",
      "role": "owner",
      "memberCount": 15,
      "projectCount": 8,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false,
    "total": 1
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **500 Internal Server Error**: Server error

**Rate Limit**: 60 requests per minute per user

---

### 3.3 Get Workspace

**Endpoint**: `GET /api/workspaces/:id`

**Authentication**: Required

**Permissions**: Must be workspace member

**Description**: Get detailed workspace information

**Path Parameters**:
- `id` (string, required): Workspace ID or slug

**Success Response** (200 OK):
```json
{
  "workspace": {
    "id": "ws_xyz789",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "description": "Our awesome team workspace",
    "logo": "https://cdn.teamflow.app/logos/acme.png",
    "ownerId": "usr_abc123",
    "owner": {
      "id": "usr_abc123",
      "name": "John Doe",
      "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
    },
    "settings": {
      "defaultRole": "member",
      "allowMemberInvites": false,
      "requireEmailVerification": true,
      "timezone": "America/New_York"
    },
    "memberCount": 15,
    "projectCount": 8,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-20T09:00:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Not a workspace member
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 3.4 Update Workspace

**Endpoint**: `PUT /api/workspaces/:id`

**Authentication**: Required

**Permissions**: Owner only

**Description**: Update workspace information

**Path Parameters**:
- `id` (string, required): Workspace ID

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "description": "Updated description",
  "logo": "https://cdn.teamflow.app/logos/new-logo.png",
  "settings": {
    "defaultRole": "viewer",
    "allowMemberInvites": true
  }
}
```

**Success Response** (200 OK):
```json
{
  "workspace": {
    "id": "ws_xyz789",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "description": "Updated description",
    "logo": "https://cdn.teamflow.app/logos/new-logo.png",
    "settings": {
      "defaultRole": "viewer",
      "allowMemberInvites": true,
      "requireEmailVerification": true,
      "timezone": "America/New_York"
    },
    "updatedAt": "2025-01-20T10:30:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 3.5 Delete Workspace

**Endpoint**: `DELETE /api/workspaces/:id`

**Authentication**: Required

**Permissions**: Owner only

**Description**: Permanently delete workspace (requires confirmation)

**Path Parameters**:
- `id` (string, required): Workspace ID

**Request Body**:
```json
{
  "confirmation": "DELETE",
  "transferDataTo": null
}
```

**Success Response** (200 OK):
```json
{
  "message": "Workspace deleted successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid confirmation
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Not workspace owner
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 3 requests per hour per user

---

### 3.6 Invite Members

**Endpoint**: `POST /api/workspaces/:id/members`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Invite users to workspace

**Path Parameters**:
- `id` (string, required): Workspace ID

**Request Body**:
```json
{
  "invitations": [
    {
      "email": "newuser@example.com",
      "role": "member",
      "message": "Welcome to our team!"
    }
  ]
}
```

**Request Schema**:
```typescript
{
  invitations: Array<{
    email: string;      // Required, valid email
    role: 'admin' | 'member' | 'viewer'; // Required
    message?: string;   // Optional, max 500 chars
  }>;
}
```

**Success Response** (201 Created):
```json
{
  "results": [
    {
      "email": "newuser@example.com",
      "status": "sent",
      "invitation": {
        "id": "inv_def456",
        "email": "newuser@example.com",
        "role": "member",
        "expiresAt": "2025-01-27T10:00:00Z",
        "token": "inv_token_abc123"
      }
    }
  ],
  "summary": {
    "sent": 1,
    "failed": 0,
    "alreadyMember": 0
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 50 invitations per hour per workspace

---

### 3.7 List Members

**Endpoint**: `GET /api/workspaces/:id/members`

**Authentication**: Required

**Permissions**: Must be workspace member

**Description**: Get all workspace members

**Path Parameters**:
- `id` (string, required): Workspace ID

**Query Parameters**:
- `role` (string, optional): Filter by role (owner, admin, member, viewer)
- `search` (string, optional): Search by name or email
- `limit` (number, optional, default: 50)
- `cursor` (string, optional): Pagination cursor

**Success Response** (200 OK):
```json
{
  "members": [
    {
      "id": "wm_ghi789",
      "user": {
        "id": "usr_abc123",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
      },
      "role": "owner",
      "joinedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false,
    "total": 15
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Not a workspace member
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 3.8 Update Member Role

**Endpoint**: `PUT /api/workspaces/:id/members/:userId`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Update workspace member's role

**Path Parameters**:
- `id` (string, required): Workspace ID
- `userId` (string, required): User ID

**Request Body**:
```json
{
  "role": "admin"
}
```

**Success Response** (200 OK):
```json
{
  "member": {
    "id": "wm_ghi789",
    "user": {
      "id": "usr_def456",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "role": "admin",
    "joinedAt": "2025-01-15T12:00:00Z",
    "updatedAt": "2025-01-20T11:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid role
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Workspace or member not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 3.9 Remove Member

**Endpoint**: `DELETE /api/workspaces/:id/members/:userId`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Remove member from workspace

**Path Parameters**:
- `id` (string, required): Workspace ID
- `userId` (string, required): User ID

**Success Response** (200 OK):
```json
{
  "message": "Member removed successfully"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Cannot remove workspace owner or insufficient permissions
- **404 Not Found**: Workspace or member not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 20 requests per minute per user

---

## 4. Project Endpoints

### 4.1 Create Project

**Endpoint**: `POST /api/projects`

**Authentication**: Required

**Permissions**: Owner, Admin, Member

**Description**: Create a new project in workspace

**Request Body**:
```json
{
  "workspaceId": "ws_xyz789",
  "name": "Website Redesign",
  "description": "Q1 2025 website redesign project",
  "icon": "🎨",
  "visibility": "public",
  "template": "kanban"
}
```

**Request Schema**:
```typescript
{
  workspaceId: string;  // Required, valid workspace ID
  name: string;         // Required, 3-100 characters
  description?: string; // Optional, max 2000 characters
  icon?: string;        // Optional, emoji or icon name
  visibility: 'public' | 'private'; // Required
  template?: 'kanban' | 'scrum' | 'bug_tracking' | 'blank'; // Optional
}
```

**Success Response** (201 Created):
```json
{
  "project": {
    "id": "prj_jkl012",
    "workspaceId": "ws_xyz789",
    "name": "Website Redesign",
    "description": "Q1 2025 website redesign project",
    "icon": "🎨",
    "visibility": "public",
    "archived": false,
    "createdBy": "usr_abc123",
    "settings": {
      "template": "kanban",
      "enableSprints": false,
      "enableStoryPoints": true,
      "taskStatuses": ["todo", "in_progress", "done"]
    },
    "createdAt": "2025-01-20T11:00:00Z",
    "updatedAt": "2025-01-20T11:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 20 projects per hour per user

---

### 4.2 List Projects

**Endpoint**: `GET /api/projects`

**Authentication**: Required

**Permissions**: Must be workspace member

**Description**: Get all projects in workspace(s)

**Query Parameters**:
- `workspaceId` (string, required): Workspace ID
- `archived` (boolean, optional, default: false): Include archived projects
- `visibility` (string, optional): Filter by visibility (public, private)
- `search` (string, optional): Search by name
- `limit` (number, optional, default: 20)
- `cursor` (string, optional): Pagination cursor

**Success Response** (200 OK):
```json
{
  "projects": [
    {
      "id": "prj_jkl012",
      "name": "Website Redesign",
      "description": "Q1 2025 website redesign project",
      "icon": "🎨",
      "visibility": "public",
      "archived": false,
      "taskCount": 24,
      "completedTaskCount": 8,
      "memberCount": 5,
      "createdBy": {
        "id": "usr_abc123",
        "name": "John Doe"
      },
      "createdAt": "2025-01-20T11:00:00Z"
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false,
    "total": 8
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid query parameters
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Not a workspace member
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 4.3 Get Project

**Endpoint**: `GET /api/projects/:id`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get detailed project information

**Path Parameters**:
- `id` (string, required): Project ID

**Success Response** (200 OK):
```json
{
  "project": {
    "id": "prj_jkl012",
    "workspaceId": "ws_xyz789",
    "name": "Website Redesign",
    "description": "Q1 2025 website redesign project",
    "icon": "🎨",
    "visibility": "public",
    "archived": false,
    "createdBy": {
      "id": "usr_abc123",
      "name": "John Doe",
      "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
    },
    "settings": {
      "template": "kanban",
      "enableSprints": false,
      "enableStoryPoints": true,
      "taskStatuses": ["todo", "in_progress", "in_review", "done"]
    },
    "stats": {
      "totalTasks": 24,
      "completedTasks": 8,
      "inProgressTasks": 10,
      "blockedTasks": 2,
      "totalStoryPoints": 89,
      "completedStoryPoints": 34
    },
    "members": [
      {
        "id": "usr_abc123",
        "name": "John Doe",
        "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg",
        "role": "admin"
      }
    ],
    "createdAt": "2025-01-20T11:00:00Z",
    "updatedAt": "2025-01-21T14:30:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 4.4 Update Project

**Endpoint**: `PUT /api/projects/:id`

**Authentication**: Required

**Permissions**: Owner, Admin, Project creator

**Description**: Update project information

**Path Parameters**:
- `id` (string, required): Project ID

**Request Body**:
```json
{
  "name": "Website Redesign 2025",
  "description": "Updated project description",
  "icon": "🚀",
  "visibility": "public",
  "settings": {
    "enableSprints": true
  }
}
```

**Success Response** (200 OK):
```json
{
  "project": {
    "id": "prj_jkl012",
    "name": "Website Redesign 2025",
    "description": "Updated project description",
    "icon": "🚀",
    "visibility": "public",
    "settings": {
      "template": "kanban",
      "enableSprints": true,
      "enableStoryPoints": true
    },
    "updatedAt": "2025-01-21T15:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 4.5 Delete Project

**Endpoint**: `DELETE /api/projects/:id`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Permanently delete project

**Path Parameters**:
- `id` (string, required): Project ID

**Request Body**:
```json
{
  "confirmation": "DELETE"
}
```

**Success Response** (200 OK):
```json
{
  "message": "Project deleted successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid confirmation
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per hour per user

---

### 4.6 Archive Project

**Endpoint**: `POST /api/projects/:id/archive`

**Authentication**: Required

**Permissions**: Owner, Admin, Project creator

**Description**: Archive project (soft delete)

**Path Parameters**:
- `id` (string, required): Project ID

**Success Response** (200 OK):
```json
{
  "project": {
    "id": "prj_jkl012",
    "archived": true,
    "archivedAt": "2025-01-21T15:30:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Cannot archive with active sprints
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 20 requests per minute per user

---

### 4.7 Restore Project

**Endpoint**: `POST /api/projects/:id/restore`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Restore archived project

**Path Parameters**:
- `id` (string, required): Project ID

**Success Response** (200 OK):
```json
{
  "project": {
    "id": "prj_jkl012",
    "archived": false,
    "archivedAt": null,
    "updatedAt": "2025-01-22T09:00:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 20 requests per minute per user

---

## 5. Task Endpoints

### 5.1 Create Task

**Endpoint**: `POST /api/tasks`

**Authentication**: Required

**Permissions**: Owner, Admin, Member

**Description**: Create a new task

**Request Body**:
```json
{
  "projectId": "prj_jkl012",
  "title": "Design homepage mockup",
  "description": "Create high-fidelity mockups for the new homepage design",
  "status": "todo",
  "priority": "high",
  "storyPoints": 5,
  "dueDate": "2025-02-01T00:00:00Z",
  "assigneeIds": ["usr_abc123", "usr_def456"],
  "labelIds": ["lbl_001", "lbl_002"]
}
```

**Request Schema**:
```typescript
{
  projectId: string;      // Required
  title: string;          // Required, 3-200 characters
  description?: string;   // Optional, markdown, max 50000 chars
  status?: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'; // Optional, default 'todo'
  priority?: 'low' | 'medium' | 'high' | 'critical'; // Optional, default 'medium'
  storyPoints?: 1 | 2 | 3 | 5 | 8 | 13 | 21; // Optional
  dueDate?: string;       // Optional, ISO 8601 datetime
  assigneeIds?: string[]; // Optional, array of user IDs
  labelIds?: string[];    // Optional, array of label IDs
}
```

**Success Response** (201 Created):
```json
{
  "task": {
    "id": "tsk_mno345",
    "projectId": "prj_jkl012",
    "title": "Design homepage mockup",
    "description": "Create high-fidelity mockups for the new homepage design",
    "status": "todo",
    "priority": "high",
    "storyPoints": 5,
    "dueDate": "2025-02-01T00:00:00Z",
    "position": 0,
    "assignees": [
      {
        "id": "usr_abc123",
        "name": "John Doe",
        "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
      }
    ],
    "labels": [
      {
        "id": "lbl_001",
        "name": "Design",
        "color": "#FF5733"
      }
    ],
    "createdBy": {
      "id": "usr_abc123",
      "name": "John Doe"
    },
    "version": 1,
    "createdAt": "2025-01-21T16:00:00Z",
    "updatedAt": "2025-01-21T16:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 60 tasks per hour per user

---

### 5.2 List Tasks

**Endpoint**: `GET /api/tasks`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get tasks with filtering and sorting

**Query Parameters**:
- `projectId` (string, required): Project ID
- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority
- `assigneeId` (string, optional): Filter by assignee
- `labelId` (string, optional): Filter by label
- `sprintId` (string, optional): Filter by sprint
- `search` (string, optional): Search in title/description
- `sortBy` (string, optional): Sort field (createdAt, updatedAt, priority, dueDate)
- `sortOrder` (string, optional): asc or desc
- `limit` (number, optional, default: 50)
- `cursor` (string, optional): Pagination cursor

**Success Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": "tsk_mno345",
      "title": "Design homepage mockup",
      "status": "todo",
      "priority": "high",
      "storyPoints": 5,
      "dueDate": "2025-02-01T00:00:00Z",
      "position": 0,
      "assignees": [
        {
          "id": "usr_abc123",
          "name": "John Doe",
          "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
        }
      ],
      "labels": [
        {
          "id": "lbl_001",
          "name": "Design",
          "color": "#FF5733"
        }
      ],
      "commentCount": 3,
      "attachmentCount": 1,
      "subtaskCount": 5,
      "completedSubtaskCount": 2,
      "createdAt": "2025-01-21T16:00:00Z",
      "updatedAt": "2025-01-21T17:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6InRza19",
    "hasMore": true,
    "total": 24
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid query parameters
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 5.3 Get Task

**Endpoint**: `GET /api/tasks/:id`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get detailed task information

**Path Parameters**:
- `id` (string, required): Task ID

**Success Response** (200 OK):
```json
{
  "task": {
    "id": "tsk_mno345",
    "projectId": "prj_jkl012",
    "project": {
      "id": "prj_jkl012",
      "name": "Website Redesign",
      "icon": "🎨"
    },
    "title": "Design homepage mockup",
    "description": "Create high-fidelity mockups for the new homepage design\n\n## Requirements\n- Mobile responsive\n- Dark mode support",
    "status": "in_progress",
    "priority": "high",
    "storyPoints": 5,
    "dueDate": "2025-02-01T00:00:00Z",
    "position": 2,
    "assignees": [
      {
        "id": "usr_abc123",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
      }
    ],
    "labels": [
      {
        "id": "lbl_001",
        "name": "Design",
        "color": "#FF5733"
      }
    ],
    "subtasks": [
      {
        "id": "sub_001",
        "title": "Create wireframes",
        "completed": true,
        "position": 0
      },
      {
        "id": "sub_002",
        "title": "Design mockups",
        "completed": false,
        "position": 1
      }
    ],
    "attachments": [
      {
        "id": "att_001",
        "filename": "mockup-v1.fig",
        "url": "https://cdn.teamflow.app/attachments/att_001",
        "mimeType": "application/figma",
        "size": 2048576,
        "uploadedBy": {
          "id": "usr_abc123",
          "name": "John Doe"
        },
        "createdAt": "2025-01-21T17:00:00Z"
      }
    ],
    "sprint": {
      "id": "spr_pqr678",
      "name": "Sprint 1",
      "status": "active"
    },
    "createdBy": {
      "id": "usr_abc123",
      "name": "John Doe",
      "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
    },
    "version": 3,
    "createdAt": "2025-01-21T16:00:00Z",
    "updatedAt": "2025-01-21T17:30:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Task not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 5.4 Update Task

**Endpoint**: `PUT /api/tasks/:id`

**Authentication**: Required

**Permissions**: Owner, Admin, Assignee

**Description**: Update task (supports partial updates)

**Path Parameters**:
- `id` (string, required): Task ID

**Request Body**:
```json
{
  "title": "Design homepage mockup - v2",
  "status": "in_progress",
  "priority": "critical",
  "assigneeIds": ["usr_abc123"],
  "version": 3
}
```

**Request Schema**:
```typescript
{
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  storyPoints?: 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;
  dueDate?: string | null;
  position?: number;
  assigneeIds?: string[];
  labelIds?: string[];
  version: number; // Required for optimistic locking
}
```

**Success Response** (200 OK):
```json
{
  "task": {
    "id": "tsk_mno345",
    "title": "Design homepage mockup - v2",
    "status": "in_progress",
    "priority": "critical",
    "version": 4,
    "updatedAt": "2025-01-21T18:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Task not found
- **409 Conflict**: Version mismatch (concurrent edit)
  ```json
  {
    "error": {
      "code": "VERSION_CONFLICT",
      "message": "Task was modified by another user",
      "currentVersion": 5
    }
  }
  ```
- **500 Internal Server Error**: Server error

**Rate Limit**: 60 requests per minute per user

---

### 5.5 Delete Task

**Endpoint**: `DELETE /api/tasks/:id`

**Authentication**: Required

**Permissions**: Owner, Admin, Task creator

**Description**: Delete task (soft delete)

**Path Parameters**:
- `id` (string, required): Task ID

**Success Response** (200 OK):
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Task not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 5.6 Add Comment

**Endpoint**: `POST /api/tasks/:id/comments`

**Authentication**: Required

**Permissions**: Owner, Admin, Member

**Description**: Add comment to task

**Path Parameters**:
- `id` (string, required): Task ID

**Request Body**:
```json
{
  "content": "Great progress! @john please review the color scheme.",
  "parentId": null
}
```

**Request Schema**:
```typescript
{
  content: string;    // Required, 1-5000 characters, markdown
  parentId?: string;  // Optional, parent comment ID for threading
}
```

**Success Response** (201 Created):
```json
{
  "comment": {
    "id": "cmt_stu901",
    "taskId": "tsk_mno345",
    "content": "Great progress! @john please review the color scheme.",
    "parentId": null,
    "user": {
      "id": "usr_def456",
      "name": "Jane Smith",
      "avatar": "https://cdn.teamflow.app/avatars/usr_def456.jpg"
    },
    "mentions": [
      {
        "id": "usr_abc123",
        "name": "John Doe"
      }
    ],
    "editCount": 0,
    "createdAt": "2025-01-21T18:30:00Z",
    "updatedAt": "2025-01-21T18:30:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Task not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 60 comments per hour per user

---

### 5.7 List Comments

**Endpoint**: `GET /api/tasks/:id/comments`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get all comments for a task

**Path Parameters**:
- `id` (string, required): Task ID

**Query Parameters**:
- `limit` (number, optional, default: 50)
- `cursor` (string, optional): Pagination cursor

**Success Response** (200 OK):
```json
{
  "comments": [
    {
      "id": "cmt_stu901",
      "content": "Great progress! @john please review the color scheme.",
      "user": {
        "id": "usr_def456",
        "name": "Jane Smith",
        "avatar": "https://cdn.teamflow.app/avatars/usr_def456.jpg"
      },
      "mentions": [
        {
          "id": "usr_abc123",
          "name": "John Doe"
        }
      ],
      "replies": [
        {
          "id": "cmt_vwx234",
          "content": "Will do! Thanks for the feedback.",
          "user": {
            "id": "usr_abc123",
            "name": "John Doe",
            "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
          },
          "parentId": "cmt_stu901",
          "createdAt": "2025-01-21T18:35:00Z"
        }
      ],
      "editCount": 0,
      "createdAt": "2025-01-21T18:30:00Z",
      "updatedAt": "2025-01-21T18:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false,
    "total": 5
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Task not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 5.8 Upload Attachment

**Endpoint**: `POST /api/tasks/:id/attachments`

**Authentication**: Required

**Permissions**: Owner, Admin, Member

**Description**: Upload file attachment to task

**Path Parameters**:
- `id` (string, required): Task ID

**Request Body**: multipart/form-data
- `file` (file, required): File to upload (max 10MB)

**Success Response** (201 Created):
```json
{
  "attachment": {
    "id": "att_002",
    "taskId": "tsk_mno345",
    "filename": "design-specs.pdf",
    "url": "https://cdn.teamflow.app/attachments/att_002",
    "mimeType": "application/pdf",
    "size": 1048576,
    "uploadedBy": {
      "id": "usr_abc123",
      "name": "John Doe"
    },
    "createdAt": "2025-01-21T19:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: File too large or invalid type
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions or task attachment limit exceeded
- **404 Not Found**: Task not found
- **413 Payload Too Large**: File exceeds 10MB limit
- **500 Internal Server Error**: Server error

**Rate Limit**: 20 uploads per hour per user

---

### 5.9 Delete Attachment

**Endpoint**: `DELETE /api/tasks/:id/attachments/:attachmentId`

**Authentication**: Required

**Permissions**: Owner, Admin, Uploader

**Description**: Delete attachment from task

**Path Parameters**:
- `id` (string, required): Task ID
- `attachmentId` (string, required): Attachment ID

**Success Response** (200 OK):
```json
{
  "message": "Attachment deleted successfully"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Task or attachment not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 5.10 AI Task Breakdown

**Endpoint**: `POST /api/tasks/:id/ai-breakdown`

**Authentication**: Required

**Permissions**: Owner, Admin, Member

**Description**: Use AI to break down task into subtasks

**Path Parameters**:
- `id` (string, required): Task ID

**Request Body**:
```json
{
  "maxSubtasks": 10,
  "detailLevel": "medium",
  "includeEstimates": true
}
```

**Request Schema**:
```typescript
{
  maxSubtasks?: number;    // Optional, default 10, max 20
  detailLevel?: 'low' | 'medium' | 'high'; // Optional, default 'medium'
  includeEstimates?: boolean; // Optional, default false
}
```

**Success Response** (200 OK):
```json
{
  "suggestions": [
    {
      "title": "Create wireframe structure",
      "description": "Design the basic layout and structure of the homepage",
      "estimatedHours": 4,
      "confidence": 0.95,
      "order": 0
    },
    {
      "title": "Design color scheme and typography",
      "description": "Select colors and fonts that match brand guidelines",
      "estimatedHours": 2,
      "confidence": 0.90,
      "order": 1
    }
  ],
  "metadata": {
    "model": "gpt-4",
    "tokensUsed": 450,
    "processingTime": 2.3
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid request or task lacks sufficient detail
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions or AI quota exceeded
- **404 Not Found**: Task not found
- **429 Too Many Requests**: AI rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: AI service temporarily unavailable

**Rate Limit**: 20 requests per hour per workspace

---

## 6. Sprint Endpoints

### 6.1 Create Sprint

**Endpoint**: `POST /api/sprints`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Create a new sprint

**Request Body**:
```json
{
  "projectId": "prj_jkl012",
  "name": "Sprint 1",
  "goal": "Complete homepage redesign",
  "startDate": "2025-01-22",
  "endDate": "2025-02-05"
}
```

**Request Schema**:
```typescript
{
  projectId: string;  // Required
  name: string;       // Required, 3-100 characters
  goal?: string;      // Optional, max 500 characters
  startDate: string;  // Required, YYYY-MM-DD
  endDate: string;    // Required, YYYY-MM-DD, must be after startDate
}
```

**Success Response** (201 Created):
```json
{
  "sprint": {
    "id": "spr_pqr678",
    "projectId": "prj_jkl012",
    "name": "Sprint 1",
    "goal": "Complete homepage redesign",
    "startDate": "2025-01-22",
    "endDate": "2025-02-05",
    "status": "planning",
    "taskCount": 0,
    "totalStoryPoints": 0,
    "createdAt": "2025-01-21T20:00:00Z",
    "updatedAt": "2025-01-21T20:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed or dates overlap with existing sprint
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 sprints per hour per project

---

### 6.2 List Sprints

**Endpoint**: `GET /api/sprints`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get all sprints for a project

**Query Parameters**:
- `projectId` (string, required): Project ID
- `status` (string, optional): Filter by status (planning, active, completed, cancelled)
- `limit` (number, optional, default: 20)
- `cursor` (string, optional): Pagination cursor

**Success Response** (200 OK):
```json
{
  "sprints": [
    {
      "id": "spr_pqr678",
      "name": "Sprint 1",
      "goal": "Complete homepage redesign",
      "startDate": "2025-01-22",
      "endDate": "2025-02-05",
      "status": "active",
      "taskCount": 12,
      "completedTaskCount": 5,
      "totalStoryPoints": 55,
      "completedStoryPoints": 21,
      "daysRemaining": 8,
      "createdAt": "2025-01-21T20:00:00Z"
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false,
    "total": 3
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid query parameters
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 6.3 Get Sprint

**Endpoint**: `GET /api/sprints/:id`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get detailed sprint information

**Path Parameters**:
- `id` (string, required): Sprint ID

**Success Response** (200 OK):
```json
{
  "sprint": {
    "id": "spr_pqr678",
    "projectId": "prj_jkl012",
    "project": {
      "id": "prj_jkl012",
      "name": "Website Redesign"
    },
    "name": "Sprint 1",
    "goal": "Complete homepage redesign",
    "startDate": "2025-01-22",
    "endDate": "2025-02-05",
    "status": "active",
    "actualStartDate": "2025-01-22T09:00:00Z",
    "actualEndDate": null,
    "tasks": [
      {
        "id": "tsk_mno345",
        "title": "Design homepage mockup",
        "status": "in_progress",
        "priority": "high",
        "storyPoints": 5,
        "assignees": [
          {
            "id": "usr_abc123",
            "name": "John Doe",
            "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg"
          }
        ]
      }
    ],
    "stats": {
      "totalTasks": 12,
      "completedTasks": 5,
      "inProgressTasks": 4,
      "todoTasks": 3,
      "totalStoryPoints": 55,
      "completedStoryPoints": 21,
      "velocity": 21,
      "daysElapsed": 7,
      "daysRemaining": 8,
      "completionRate": 0.42,
      "burndown": [
        {
          "date": "2025-01-22",
          "remainingPoints": 55,
          "idealPoints": 55
        },
        {
          "date": "2025-01-23",
          "remainingPoints": 50,
          "idealPoints": 51
        }
      ]
    },
    "createdAt": "2025-01-21T20:00:00Z",
    "updatedAt": "2025-01-28T14:30:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Sprint not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 100 requests per minute per user

---

### 6.4 Update Sprint

**Endpoint**: `PUT /api/sprints/:id`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Update sprint information

**Path Parameters**:
- `id` (string, required): Sprint ID

**Request Body**:
```json
{
  "name": "Sprint 1 - Extended",
  "goal": "Complete homepage redesign and add animations",
  "endDate": "2025-02-08"
}
```

**Success Response** (200 OK):
```json
{
  "sprint": {
    "id": "spr_pqr678",
    "name": "Sprint 1 - Extended",
    "goal": "Complete homepage redesign and add animations",
    "endDate": "2025-02-08",
    "updatedAt": "2025-01-28T15:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed or cannot edit active sprint dates
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Sprint not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 6.5 Delete Sprint

**Endpoint**: `DELETE /api/sprints/:id`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Delete sprint (only if status is planning and no tasks)

**Path Parameters**:
- `id` (string, required): Sprint ID

**Success Response** (200 OK):
```json
{
  "message": "Sprint deleted successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Cannot delete sprint with tasks or if not in planning state
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Sprint not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per hour per user

---

### 6.6 Start Sprint

**Endpoint**: `POST /api/sprints/:id/start`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Start a sprint (transition from planning to active)

**Path Parameters**:
- `id` (string, required): Sprint ID

**Success Response** (200 OK):
```json
{
  "sprint": {
    "id": "spr_pqr678",
    "status": "active",
    "actualStartDate": "2025-01-22T09:00:00Z",
    "updatedAt": "2025-01-22T09:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Another sprint is already active or sprint already started
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Sprint not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per hour per project

---

### 6.7 Complete Sprint

**Endpoint**: `POST /api/sprints/:id/complete`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Complete a sprint and handle incomplete tasks

**Path Parameters**:
- `id` (string, required): Sprint ID

**Request Body**:
```json
{
  "incompleteTasks": {
    "action": "move_to_backlog",
    "targetSprintId": null
  }
}
```

**Request Schema**:
```typescript
{
  incompleteTasks: {
    action: 'move_to_backlog' | 'move_to_next_sprint' | 'keep';
    targetSprintId?: string; // Required if action is 'move_to_next_sprint'
  };
}
```

**Success Response** (200 OK):
```json
{
  "sprint": {
    "id": "spr_pqr678",
    "status": "completed",
    "actualEndDate": "2025-02-05T18:00:00Z",
    "metrics": {
      "totalTasks": 12,
      "completedTasks": 10,
      "totalStoryPoints": 55,
      "completedStoryPoints": 47,
      "velocity": 47,
      "completionRate": 0.85,
      "averageCycleTime": 3.2
    }
  },
  "report": {
    "summary": "Sprint completed with 85% completion rate",
    "completedTasks": 10,
    "incompleteTasks": 2,
    "tasksMovedToBacklog": 2
  }
}
```

**Error Responses**:
- **400 Bad Request**: Sprint not active or invalid incompleteTasks action
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Sprint not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per hour per project

---

### 6.8 Add Tasks to Sprint

**Endpoint**: `POST /api/sprints/:id/tasks`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Add tasks to sprint

**Path Parameters**:
- `id` (string, required): Sprint ID

**Request Body**:
```json
{
  "taskIds": ["tsk_mno345", "tsk_yza567"]
}
```

**Success Response** (200 OK):
```json
{
  "added": 2,
  "sprint": {
    "id": "spr_pqr678",
    "taskCount": 14,
    "totalStoryPoints": 63
  }
}
```

**Error Responses**:
- **400 Bad Request**: Tasks not in same project or validation failed
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Sprint or tasks not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 6.9 Remove Task from Sprint

**Endpoint**: `DELETE /api/sprints/:id/tasks/:taskId`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Remove task from sprint

**Path Parameters**:
- `id` (string, required): Sprint ID
- `taskId` (string, required): Task ID

**Success Response** (200 OK):
```json
{
  "message": "Task removed from sprint",
  "sprint": {
    "id": "spr_pqr678",
    "taskCount": 13,
    "totalStoryPoints": 58
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Sprint or task not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 6.10 AI Sprint Planning

**Endpoint**: `POST /api/sprints/:id/ai-plan`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Use AI to suggest optimal sprint plan

**Path Parameters**:
- `id` (string, required): Sprint ID

**Request Body**:
```json
{
  "teamVelocity": 45,
  "teamMembers": ["usr_abc123", "usr_def456"],
  "focusAreas": ["frontend", "design"],
  "constraints": {
    "maxTasksPerMember": 5,
    "prioritizeHighPriority": true
  }
}
```

**Request Schema**:
```typescript
{
  teamVelocity?: number;       // Optional, default from historical data
  teamMembers?: string[];      // Optional, default all project members
  focusAreas?: string[];       // Optional, filter by labels/categories
  constraints?: {
    maxTasksPerMember?: number;
    prioritizeHighPriority?: boolean;
    balanceWorkload?: boolean;
  };
}
```

**Success Response** (200 OK):
```json
{
  "plan": {
    "recommendedTasks": [
      {
        "taskId": "tsk_mno345",
        "title": "Design homepage mockup",
        "storyPoints": 5,
        "priority": "high",
        "confidence": 0.95,
        "suggestedAssignee": "usr_abc123",
        "reasoning": "High priority, fits user skill set"
      }
    ],
    "summary": {
      "totalTasks": 10,
      "totalStoryPoints": 47,
      "capacityUtilization": 0.94,
      "teamBalance": 0.88
    },
    "warnings": [
      "Sprint is at 94% capacity - consider removing 1-2 tasks"
    ],
    "alternatives": [
      {
        "description": "Lower capacity plan",
        "totalTasks": 8,
        "totalStoryPoints": 40
      }
    ]
  },
  "metadata": {
    "model": "gpt-4",
    "tokensUsed": 850,
    "processingTime": 4.1
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid request or insufficient data for planning
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions or AI quota exceeded
- **404 Not Found**: Sprint not found
- **429 Too Many Requests**: AI rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: AI service temporarily unavailable

**Rate Limit**: 10 requests per hour per workspace

---

## 7. Comment Endpoints

Comments are accessed through task endpoints (see section 5.6 and 5.7).

Additional comment-specific endpoints:

### 7.1 Update Comment

**Endpoint**: `PUT /api/comments/:id`

**Authentication**: Required

**Permissions**: Comment author, Owner, Admin

**Description**: Update comment content

**Path Parameters**:
- `id` (string, required): Comment ID

**Request Body**:
```json
{
  "content": "Updated comment text with @mentions"
}
```

**Success Response** (200 OK):
```json
{
  "comment": {
    "id": "cmt_stu901",
    "content": "Updated comment text with @mentions",
    "edited": true,
    "editCount": 1,
    "editedAt": "2025-01-22T10:00:00Z",
    "updatedAt": "2025-01-22T10:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed or edit window expired (15 minutes)
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Comment not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 7.2 Delete Comment

**Endpoint**: `DELETE /api/comments/:id`

**Authentication**: Required

**Permissions**: Comment author, Owner, Admin

**Description**: Delete comment (soft delete)

**Path Parameters**:
- `id` (string, required): Comment ID

**Success Response** (200 OK):
```json
{
  "message": "Comment deleted successfully",
  "undoWindow": 5
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Comment not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

## 8. Analytics Endpoints

### 8.1 Project Dashboard

**Endpoint**: `GET /api/analytics/project/:id/dashboard`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get comprehensive project analytics

**Path Parameters**:
- `id` (string, required): Project ID

**Query Parameters**:
- `period` (string, optional, default: '30d'): Time period (7d, 30d, 90d, all)

**Success Response** (200 OK):
```json
{
  "dashboard": {
    "overview": {
      "totalTasks": 45,
      "completedTasks": 28,
      "inProgressTasks": 12,
      "blockedTasks": 2,
      "completionRate": 0.62,
      "averageCycleTime": 4.5,
      "totalStoryPoints": 210,
      "completedStoryPoints": 145
    },
    "velocity": {
      "current": 45,
      "average": 42,
      "trend": "up",
      "history": [
        {
          "period": "Sprint 1",
          "completed": 38,
          "committed": 45
        }
      ]
    },
    "tasksByStatus": {
      "todo": 3,
      "in_progress": 12,
      "in_review": 3,
      "done": 28,
      "blocked": 2
    },
    "tasksByPriority": {
      "low": 5,
      "medium": 20,
      "high": 15,
      "critical": 3
    },
    "teamPerformance": [
      {
        "userId": "usr_abc123",
        "name": "John Doe",
        "completedTasks": 12,
        "completedStoryPoints": 55,
        "averageCycleTime": 3.8
      }
    ],
    "recentActivity": [
      {
        "id": "act_001",
        "action": "task_completed",
        "taskId": "tsk_mno345",
        "taskTitle": "Design homepage mockup",
        "userId": "usr_abc123",
        "userName": "John Doe",
        "timestamp": "2025-01-22T11:00:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 8.2 Project Velocity

**Endpoint**: `GET /api/analytics/project/:id/velocity`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get velocity metrics and trends

**Path Parameters**:
- `id` (string, required): Project ID

**Query Parameters**:
- `sprints` (number, optional, default: 5): Number of recent sprints to include

**Success Response** (200 OK):
```json
{
  "velocity": {
    "current": 45,
    "average": 42,
    "median": 40,
    "trend": "increasing",
    "predictedNext": 47,
    "history": [
      {
        "sprintId": "spr_pqr678",
        "sprintName": "Sprint 1",
        "committed": 50,
        "completed": 45,
        "completionRate": 0.90,
        "startDate": "2025-01-22",
        "endDate": "2025-02-05"
      }
    ],
    "recommendations": [
      "Team velocity is increasing. Consider taking on 47 points next sprint.",
      "Completion rate is high (90%). Sprint planning is accurate."
    ]
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Project not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

### 8.3 Sprint Burndown

**Endpoint**: `GET /api/analytics/project/:id/burndown`

**Authentication**: Required

**Permissions**: Must have project access

**Description**: Get burndown chart data for active sprint

**Path Parameters**:
- `id` (string, required): Project ID

**Query Parameters**:
- `sprintId` (string, optional): Specific sprint ID (default: active sprint)

**Success Response** (200 OK):
```json
{
  "burndown": {
    "sprintId": "spr_pqr678",
    "sprintName": "Sprint 1",
    "startDate": "2025-01-22",
    "endDate": "2025-02-05",
    "totalStoryPoints": 55,
    "remainingStoryPoints": 21,
    "daysElapsed": 7,
    "daysRemaining": 8,
    "isOnTrack": true,
    "data": [
      {
        "date": "2025-01-22",
        "remainingPoints": 55,
        "idealPoints": 55,
        "completedPoints": 0
      },
      {
        "date": "2025-01-23",
        "remainingPoints": 50,
        "idealPoints": 51.3,
        "completedPoints": 5
      },
      {
        "date": "2025-01-28",
        "remainingPoints": 21,
        "idealPoints": 24.4,
        "completedPoints": 34
      }
    ],
    "projection": {
      "estimatedCompletionDate": "2025-02-04",
      "estimatedCompletionPoints": 52,
      "onTrack": true
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: No project access
- **404 Not Found**: Project or sprint not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 60 requests per minute per user

---

### 8.4 Workspace Team Performance

**Endpoint**: `GET /api/analytics/workspace/:id/team-performance`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Get team performance analytics across all projects

**Path Parameters**:
- `id` (string, required): Workspace ID

**Query Parameters**:
- `period` (string, optional, default: '30d'): Time period (7d, 30d, 90d)
- `projectId` (string, optional): Filter by specific project

**Success Response** (200 OK):
```json
{
  "teamPerformance": {
    "overview": {
      "totalMembers": 15,
      "activeMembers": 12,
      "totalTasksCompleted": 145,
      "totalStoryPointsCompleted": 567,
      "averageCycleTime": 4.2,
      "averageTasksPerMember": 12
    },
    "members": [
      {
        "userId": "usr_abc123",
        "name": "John Doe",
        "avatar": "https://cdn.teamflow.app/avatars/usr_abc123.jpg",
        "role": "member",
        "stats": {
          "tasksCompleted": 24,
          "storyPointsCompleted": 95,
          "averageCycleTime": 3.8,
          "onTimeDelivery": 0.92,
          "activeDays": 18
        },
        "projects": [
          {
            "projectId": "prj_jkl012",
            "projectName": "Website Redesign",
            "tasksCompleted": 15
          }
        ]
      }
    ],
    "trends": {
      "productivity": "increasing",
      "collaboration": "stable",
      "bottlenecks": [
        {
          "type": "blocked_tasks",
          "count": 5,
          "averageDuration": 2.3
        }
      ]
    }
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 30 requests per minute per user

---

## 9. Integration Endpoints

### 9.1 Connect Slack

**Endpoint**: `POST /api/integrations/slack/connect`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Connect Slack integration to workspace

**Request Body**:
```json
{
  "workspaceId": "ws_xyz789",
  "code": "slack_oauth_code",
  "redirectUri": "https://teamflow.app/integrations/callback"
}
```

**Success Response** (201 Created):
```json
{
  "integration": {
    "id": "int_bcd890",
    "workspaceId": "ws_xyz789",
    "type": "slack",
    "status": "connected",
    "config": {
      "teamName": "Acme Corp",
      "channels": [
        {
          "id": "C12345",
          "name": "#general"
        }
      ]
    },
    "connectedAt": "2025-01-22T12:00:00Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid OAuth code
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 5 requests per hour per workspace

---

### 9.2 Connect GitHub

**Endpoint**: `POST /api/integrations/github/connect`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Connect GitHub integration to workspace

**Request Body**:
```json
{
  "workspaceId": "ws_xyz789",
  "code": "github_oauth_code",
  "redirectUri": "https://teamflow.app/integrations/callback"
}
```

**Success Response** (201 Created):
```json
{
  "integration": {
    "id": "int_efg123",
    "workspaceId": "ws_xyz789",
    "type": "github",
    "status": "connected",
    "config": {
      "username": "acme-corp",
      "repositories": [
        {
          "id": 12345,
          "name": "acme-corp/website",
          "fullName": "acme-corp/website"
        }
      ]
    },
    "connectedAt": "2025-01-22T12:30:00Z"
  }
}
```

**Error Responses**: Same as Slack

**Rate Limit**: 5 requests per hour per workspace

---

### 9.3 Connect Calendar

**Endpoint**: `POST /api/integrations/calendar/connect`

**Authentication**: Required

**Permissions**: Owner, Admin, Member (for personal calendar)

**Description**: Connect Google Calendar or Outlook Calendar

**Request Body**:
```json
{
  "workspaceId": "ws_xyz789",
  "provider": "google",
  "code": "google_oauth_code",
  "redirectUri": "https://teamflow.app/integrations/callback"
}
```

**Success Response** (201 Created):
```json
{
  "integration": {
    "id": "int_hij456",
    "workspaceId": "ws_xyz789",
    "type": "calendar",
    "status": "connected",
    "config": {
      "provider": "google",
      "email": "user@example.com",
      "syncEnabled": true
    },
    "connectedAt": "2025-01-22T13:00:00Z"
  }
}
```

**Error Responses**: Same as Slack

**Rate Limit**: 10 requests per hour per user

---

### 9.4 List Integrations

**Endpoint**: `GET /api/integrations`

**Authentication**: Required

**Permissions**: Must be workspace member

**Description**: Get all integrations for workspace

**Query Parameters**:
- `workspaceId` (string, required): Workspace ID
- `type` (string, optional): Filter by type (slack, github, jira, webhook, calendar)
- `status` (string, optional): Filter by status (connected, disconnected, failed)

**Success Response** (200 OK):
```json
{
  "integrations": [
    {
      "id": "int_bcd890",
      "type": "slack",
      "status": "connected",
      "config": {
        "teamName": "Acme Corp",
        "channels": ["#general", "#dev"]
      },
      "lastSyncAt": "2025-01-22T14:00:00Z",
      "connectedAt": "2025-01-22T12:00:00Z"
    }
  ]
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Not a workspace member
- **404 Not Found**: Workspace not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 60 requests per minute per user

---

### 9.5 Delete Integration

**Endpoint**: `DELETE /api/integrations/:id`

**Authentication**: Required

**Permissions**: Owner, Admin

**Description**: Disconnect and delete integration

**Path Parameters**:
- `id` (string, required): Integration ID

**Success Response** (200 OK):
```json
{
  "message": "Integration disconnected successfully"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Integration not found
- **500 Internal Server Error**: Server error

**Rate Limit**: 10 requests per hour per user

---

## 10. WebSocket Events

TeamFlow uses WebSocket connections for real-time updates.

**WebSocket URL**: `wss://api.teamflow.app/v1/ws`

**Authentication**: Send access token in connection query parameter:
```
wss://api.teamflow.app/v1/ws?token=<access_token>
```

### 10.1 Connection & Rooms

**Room Structure**:
- `workspace:{workspaceId}` - All workspace updates
- `project:{projectId}` - Project-specific updates
- `task:{taskId}` - Task-specific updates
- `user:{userId}` - User-specific notifications

**Connection Flow**:
```json
// Client → Server: Join rooms
{
  "type": "join",
  "rooms": ["workspace:ws_xyz789", "project:prj_jkl012"]
}

// Server → Client: Confirmation
{
  "type": "joined",
  "rooms": ["workspace:ws_xyz789", "project:prj_jkl012"]
}
```

### 10.2 Event Types

#### Task Events

**TASK_CREATED**
```json
{
  "event": "TASK_CREATED",
  "room": "project:prj_jkl012",
  "data": {
    "taskId": "tsk_mno345",
    "task": {
      "id": "tsk_mno345",
      "title": "Design homepage mockup",
      "status": "todo",
      "priority": "high",
      "projectId": "prj_jkl012"
    },
    "userId": "usr_abc123",
    "userName": "John Doe",
    "timestamp": "2025-01-22T15:00:00Z"
  }
}
```

**TASK_UPDATED**
```json
{
  "event": "TASK_UPDATED",
  "room": "project:prj_jkl012",
  "data": {
    "taskId": "tsk_mno345",
    "changes": {
      "status": {
        "from": "todo",
        "to": "in_progress"
      },
      "position": {
        "from": 0,
        "to": 2
      }
    },
    "version": 4,
    "userId": "usr_abc123",
    "userName": "John Doe",
    "timestamp": "2025-01-22T15:30:00Z"
  }
}
```

**TASK_DELETED**
```json
{
  "event": "TASK_DELETED",
  "room": "project:prj_jkl012",
  "data": {
    "taskId": "tsk_mno345",
    "userId": "usr_abc123",
    "timestamp": "2025-01-22T16:00:00Z"
  }
}
```

**TASK_ASSIGNED**
```json
{
  "event": "TASK_ASSIGNED",
  "room": "project:prj_jkl012",
  "data": {
    "taskId": "tsk_mno345",
    "taskTitle": "Design homepage mockup",
    "assignedTo": {
      "id": "usr_def456",
      "name": "Jane Smith"
    },
    "assignedBy": {
      "id": "usr_abc123",
      "name": "John Doe"
    },
    "timestamp": "2025-01-22T16:15:00Z"
  }
}
```

#### Comment Events

**COMMENT_CREATED**
```json
{
  "event": "COMMENT_CREATED",
  "room": "task:tsk_mno345",
  "data": {
    "commentId": "cmt_stu901",
    "taskId": "tsk_mno345",
    "content": "Great progress! @john please review.",
    "userId": "usr_def456",
    "userName": "Jane Smith",
    "mentions": ["usr_abc123"],
    "timestamp": "2025-01-22T16:30:00Z"
  }
}
```

**COMMENT_EDITED**
```json
{
  "event": "COMMENT_EDITED",
  "room": "task:tsk_mno345",
  "data": {
    "commentId": "cmt_stu901",
    "taskId": "tsk_mno345",
    "content": "Updated comment text",
    "userId": "usr_def456",
    "editCount": 1,
    "timestamp": "2025-01-22T16:35:00Z"
  }
}
```

**COMMENT_DELETED**
```json
{
  "event": "COMMENT_DELETED",
  "room": "task:tsk_mno345",
  "data": {
    "commentId": "cmt_stu901",
    "taskId": "tsk_mno345",
    "userId": "usr_def456",
    "timestamp": "2025-01-22T16:40:00Z"
  }
}
```

#### Sprint Events

**SPRINT_STARTED**
```json
{
  "event": "SPRINT_STARTED",
  "room": "project:prj_jkl012",
  "data": {
    "sprintId": "spr_pqr678",
    "sprintName": "Sprint 1",
    "startDate": "2025-01-22",
    "endDate": "2025-02-05",
    "taskCount": 12,
    "totalStoryPoints": 55,
    "userId": "usr_abc123",
    "timestamp": "2025-01-22T09:00:00Z"
  }
}
```

**SPRINT_COMPLETED**
```json
{
  "event": "SPRINT_COMPLETED",
  "room": "project:prj_jkl012",
  "data": {
    "sprintId": "spr_pqr678",
    "sprintName": "Sprint 1",
    "metrics": {
      "completedTasks": 10,
      "totalTasks": 12,
      "completedStoryPoints": 47,
      "totalStoryPoints": 55,
      "velocity": 47
    },
    "userId": "usr_abc123",
    "timestamp": "2025-02-05T18:00:00Z"
  }
}
```

#### Workspace Events

**MEMBER_JOINED**
```json
{
  "event": "MEMBER_JOINED",
  "room": "workspace:ws_xyz789",
  "data": {
    "userId": "usr_ghi789",
    "userName": "Bob Johnson",
    "userAvatar": "https://cdn.teamflow.app/avatars/usr_ghi789.jpg",
    "role": "member",
    "invitedBy": "usr_abc123",
    "timestamp": "2025-01-22T17:00:00Z"
  }
}
```

**MEMBER_REMOVED**
```json
{
  "event": "MEMBER_REMOVED",
  "room": "workspace:ws_xyz789",
  "data": {
    "userId": "usr_ghi789",
    "userName": "Bob Johnson",
    "removedBy": "usr_abc123",
    "timestamp": "2025-01-22T17:30:00Z"
  }
}
```

#### Presence Events

**USER_ONLINE**
```json
{
  "event": "USER_ONLINE",
  "room": "workspace:ws_xyz789",
  "data": {
    "userId": "usr_abc123",
    "userName": "John Doe",
    "timestamp": "2025-01-22T08:00:00Z"
  }
}
```

**USER_OFFLINE**
```json
{
  "event": "USER_OFFLINE",
  "room": "workspace:ws_xyz789",
  "data": {
    "userId": "usr_abc123",
    "timestamp": "2025-01-22T18:00:00Z"
  }
}
```

**USER_TYPING**
```json
{
  "event": "USER_TYPING",
  "room": "task:tsk_mno345",
  "data": {
    "userId": "usr_abc123",
    "userName": "John Doe",
    "entityType": "comment",
    "timestamp": "2025-01-22T16:25:00Z"
  }
}
```

### 10.3 Client Implementation Example

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://api.teamflow.app/v1/ws?token=' + accessToken);

ws.onopen = () => {
  // Join rooms
  ws.send(JSON.stringify({
    type: 'join',
    rooms: ['workspace:ws_xyz789', 'project:prj_jkl012']
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.event) {
    case 'TASK_UPDATED':
      handleTaskUpdate(message.data);
      break;
    case 'COMMENT_CREATED':
      handleNewComment(message.data);
      break;
    // ... handle other events
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  // Reconnect with exponential backoff
  setTimeout(reconnect, 1000);
};
```

---

## 11. Common Patterns

### 11.1 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid auth token |
| `ACCOUNT_LOCKED` | 403 | Account locked due to failed attempts |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VERSION_CONFLICT` | 409 | Optimistic locking conflict |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### 11.2 Pagination

All list endpoints support cursor-based pagination:

**Request**:
```
GET /api/tasks?projectId=prj_jkl012&limit=20&cursor=eyJpZCI6InRza19tbjM0NSJ9
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6InRza19vcHE2NzgiLCJjcmVhdGVkQXQiOiIyMDI1LTAxLTIyIn0",
    "hasMore": true,
    "total": 145
  }
}
```

### 11.3 Filtering & Sorting

**Filtering**:
```
GET /api/tasks?projectId=prj_jkl012&status=in_progress&priority=high&assigneeId=usr_abc123
```

**Sorting**:
```
GET /api/tasks?projectId=prj_jkl012&sortBy=dueDate&sortOrder=asc
```

### 11.4 Partial Updates

Use `PUT` for partial updates (only include fields to update):
```json
PUT /api/tasks/tsk_mno345
{
  "status": "in_progress",
  "version": 3
}
```

### 11.5 Batch Operations

Some endpoints support batch operations:
```json
POST /api/tasks/batch-update
{
  "taskIds": ["tsk_001", "tsk_002", "tsk_003"],
  "updates": {
    "status": "todo",
    "priority": "high"
  }
}
```

### 11.6 Webhooks

Workspace owners can configure webhooks to receive events:

**Configure Webhook**:
```json
POST /api/webhooks
{
  "workspaceId": "ws_xyz789",
  "url": "https://example.com/webhooks/teamflow",
  "events": ["TASK_CREATED", "TASK_UPDATED", "COMMENT_CREATED"],
  "secret": "whsec_abc123"
}
```

**Webhook Payload**:
```json
POST https://example.com/webhooks/teamflow
{
  "id": "evt_abc123",
  "event": "TASK_CREATED",
  "workspaceId": "ws_xyz789",
  "data": {
    "taskId": "tsk_mno345",
    "task": { ... }
  },
  "timestamp": "2025-01-22T15:00:00Z"
}
```

**Headers**:
```
X-TeamFlow-Event: TASK_CREATED
X-TeamFlow-Signature: sha256=abc123...
X-TeamFlow-Delivery: evt_abc123
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Status**: Ready for Implementation

**Notes**:
- All timestamps are in ISO 8601 format (UTC)
- All IDs use prefixed format (e.g., `usr_`, `tsk_`, `prj_`)
- All responses include `requestId` header for debugging
- CORS enabled for configured domains
- API versioning via URL path (`/v1/`)
- Breaking changes will increment major version