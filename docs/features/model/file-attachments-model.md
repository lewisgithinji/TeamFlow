# File Attachments - Model Document

**Feature:** File Attachments
**Phase:** 2 - Model
**Timeline:** Week 1, Days 1-2
**Status:** Complete
**Date:** 2025-10-09

---

## Table of Contents
1. [Data Models](#data-models)
2. [API Contracts](#api-contracts)
3. [User Flows](#user-flows)
4. [State Machines](#state-machines)
5. [System Interactions](#system-interactions)
6. [Security Model](#security-model)
7. [Storage Strategy](#storage-strategy)

---

## 1. Data Models

### 1.1 Database Schema

The `Attachment` model already exists in the Prisma schema. Review and enhancement:

#### Current Schema (schema.prisma:390-407)
```prisma
model Attachment {
  id         String   @id @default(uuid())
  taskId     String
  filename   String
  url        String
  mimeType   String
  size       Int
  uploadedBy String?
  createdAt  DateTime @default(now())

  // Relations
  task     Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader User? @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)

  @@index([taskId])
  @@index([uploadedBy])
  @@map("attachments")
}
```

#### Required Enhancements

**Add to schema.prisma:**
```prisma
enum AttachmentStatus {
  UPLOADING    // Upload in progress
  AVAILABLE    // Successfully uploaded and available
  FAILED       // Upload failed
  DELETED      // Soft deleted
  VIRUS_FOUND  // Flagged by virus scanner
}

model Attachment {
  id            String           @id @default(uuid())
  taskId        String
  filename      String
  originalName  String           // Original filename from user
  url           String           // Signed URL or storage path
  storageKey    String           // S3/R2 object key
  mimeType      String
  size          Int              // Size in bytes
  status        AttachmentStatus @default(UPLOADING)
  uploadedBy    String?
  thumbnailUrl  String?          // For image previews
  metadata      Json?            @default("{}")  // width, height, duration, etc.
  checksum      String?          // SHA256 hash for integrity
  virusScanAt   DateTime?
  virusScanResult String?
  deletedAt     DateTime?
  deletedBy     String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  // Relations
  task     Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader User? @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)

  @@index([taskId])
  @@index([uploadedBy])
  @@index([status])
  @@index([createdAt])
  @@map("attachments")
}
```

#### Add Activity Tracking for Attachments

**Update ActivityAction enum:**
```prisma
enum ActivityAction {
  CREATED
  UPDATED
  DELETED
  ASSIGNED
  COMMENTED
  STATUS_CHANGED
  MOVED
  ATTACHMENT_ADDED      // New
  ATTACHMENT_DELETED    // New
}
```

**Update EntityType enum:**
```prisma
enum EntityType {
  TASK
  PROJECT
  WORKSPACE
  COMMENT
  SPRINT
  ATTACHMENT  // New
}
```

### 1.2 TypeScript Interfaces

**Location:** `apps/api/src/modules/attachment/attachment.types.ts`

```typescript
import { AttachmentStatus } from '@teamflow/database';

export interface AttachmentMetadata {
  // Image metadata
  width?: number;
  height?: number;
  format?: string;

  // Video metadata
  duration?: number;
  codec?: string;

  // Document metadata
  pages?: number;
  author?: string;
}

export interface CreateAttachmentInput {
  taskId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  checksum?: string;
  metadata?: AttachmentMetadata;
}

export interface AttachmentResponse {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  url: string;  // Signed URL (time-limited)
  mimeType: string;
  size: number;
  status: AttachmentStatus;
  thumbnailUrl?: string;
  metadata?: AttachmentMetadata;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadUrlResponse {
  uploadUrl: string;        // Presigned upload URL
  storageKey: string;       // Key to use for finalizing
  expiresIn: number;        // Seconds until expiry
  maxSize: number;          // Max file size allowed
}

export interface AttachmentListResponse {
  attachments: AttachmentResponse[];
  totalSize: number;        // Total bytes used by task
  count: number;
}
```

### 1.3 Validation Rules

```typescript
export const ATTACHMENT_CONSTRAINTS = {
  // File size limits
  MAX_FILE_SIZE: 10 * 1024 * 1024,          // 10MB per file
  MAX_TASK_STORAGE: 50 * 1024 * 1024,       // 50MB per task
  MAX_WORKSPACE_STORAGE: 5 * 1024 * 1024 * 1024, // 5GB per workspace (future)

  // File type restrictions
  ALLOWED_MIME_TYPES: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Text files
    'text/plain',
    'text/markdown',
    'text/csv',

    // Code files
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'application/xml',

    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',

    // Video (limited support)
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ],

  // Image thumbnail generation
  THUMBNAIL_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  THUMBNAIL_SIZE: {
    width: 300,
    height: 300,
  },

  // URL expiry
  SIGNED_URL_EXPIRY: 3600,  // 1 hour in seconds
  UPLOAD_URL_EXPIRY: 900,   // 15 minutes in seconds

  // Filename
  MAX_FILENAME_LENGTH: 255,
  INVALID_FILENAME_CHARS: /[<>:"/\\|?*\x00-\x1F]/g,
};
```

---

## 2. API Contracts

### 2.1 REST Endpoints

#### **POST /api/tasks/:taskId/attachments/upload-url**
Request presigned upload URL

**Request:**
```typescript
POST /api/tasks/:taskId/attachments/upload-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "bug-screenshot.png",
  "mimeType": "image/png",
  "size": 2048576
}
```

**Response (200 OK):**
```json
{
  "uploadUrl": "https://r2.cloudflare.com/bucket/...",
  "storageKey": "attachments/task-123/abc-def-456.png",
  "expiresIn": 900,
  "maxSize": 10485760
}
```

**Errors:**
- `400 Bad Request` - Invalid file type or size
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No access to task
- `404 Not Found` - Task not found
- `413 Payload Too Large` - File exceeds size limit

---

#### **POST /api/tasks/:taskId/attachments**
Finalize attachment after upload

**Request:**
```typescript
POST /api/tasks/:taskId/attachments
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "bug-screenshot.png",
  "originalName": "Screenshot 2024-01-15.png",
  "storageKey": "attachments/task-123/abc-def-456.png",
  "mimeType": "image/png",
  "size": 2048576,
  "checksum": "sha256:abc123...",
  "metadata": {
    "width": 1920,
    "height": 1080
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Attachment created successfully",
  "data": {
    "id": "att-789",
    "taskId": "task-123",
    "filename": "bug-screenshot.png",
    "originalName": "Screenshot 2024-01-15.png",
    "url": "https://r2.cloudflare.com/bucket/attachments/task-123/abc-def-456.png?signature=...",
    "mimeType": "image/png",
    "size": 2048576,
    "status": "AVAILABLE",
    "thumbnailUrl": "https://r2.cloudflare.com/bucket/thumbnails/...",
    "metadata": {
      "width": 1920,
      "height": 1080
    },
    "uploadedBy": {
      "id": "user-456",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No access to task
- `404 Not Found` - Task or storage key not found

---

#### **GET /api/tasks/:taskId/attachments**
List all attachments for a task

**Request:**
```typescript
GET /api/tasks/:taskId/attachments
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "attachments": [
      {
        "id": "att-789",
        "taskId": "task-123",
        "filename": "bug-screenshot.png",
        "originalName": "Screenshot 2024-01-15.png",
        "url": "https://r2.cloudflare.com/...",
        "mimeType": "image/png",
        "size": 2048576,
        "status": "AVAILABLE",
        "thumbnailUrl": "https://...",
        "uploadedBy": {
          "id": "user-456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "totalSize": 2048576,
    "count": 1
  }
}
```

**Errors:**
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

---

#### **GET /api/attachments/:id/download**
Get download URL for attachment

**Request:**
```typescript
GET /api/attachments/:id/download
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "downloadUrl": "https://r2.cloudflare.com/bucket/...?signature=...",
  "filename": "bug-screenshot.png",
  "expiresIn": 3600
}
```

**Errors:**
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

---

#### **DELETE /api/attachments/:id**
Delete an attachment

**Request:**
```typescript
DELETE /api/attachments/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Attachment deleted successfully"
}
```

**Errors:**
- `401 Unauthorized`
- `403 Forbidden` - Only uploader or workspace admin can delete
- `404 Not Found`

---

### 2.2 WebSocket Events

#### **Client → Server Events**

```typescript
// No client-initiated upload events (use REST API)
```

#### **Server → Client Events**

```typescript
// When attachment is added to task
{
  "event": "attachment:added",
  "data": {
    "attachmentId": "att-789",
    "taskId": "task-123",
    "projectId": "proj-456",
    "attachment": { /* AttachmentResponse */ },
    "uploadedBy": {
      "userId": "user-123",
      "name": "John Doe"
    }
  }
}

// When attachment is deleted
{
  "event": "attachment:deleted",
  "data": {
    "attachmentId": "att-789",
    "taskId": "task-123",
    "projectId": "proj-456",
    "deletedBy": {
      "userId": "user-123",
      "name": "John Doe"
    }
  }
}
```

---

## 3. User Flows

### 3.1 Upload Flow (Happy Path)

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Open task detail modal
       ▼
┌─────────────────────┐
│  Task Detail View   │
└──────┬──────────────┘
       │
       │ 2. Click "Attach files" or drag file
       ▼
┌─────────────────────┐
│  File Picker        │
└──────┬──────────────┘
       │
       │ 3. Select file(s)
       ▼
┌─────────────────────┐
│  Client Validation  │
│  - Check file type  │
│  - Check file size  │
│  - Calculate hash   │
└──────┬──────────────┘
       │
       │ 4. Request upload URL
       │    POST /api/tasks/:id/attachments/upload-url
       ▼
┌─────────────────────┐
│   Backend           │
│  - Validate access  │
│  - Check quota      │
│  - Generate URL     │
└──────┬──────────────┘
       │
       │ 5. Return presigned URL
       ▼
┌─────────────────────┐
│   Client            │
│  - Upload to R2     │
│  - Show progress    │
└──────┬──────────────┘
       │
       │ 6. Upload complete
       │    POST /api/tasks/:id/attachments
       ▼
┌─────────────────────┐
│   Backend           │
│  - Verify upload    │
│  - Scan for virus   │
│  - Generate thumb   │
│  - Save to DB       │
│  - Create activity  │
└──────┬──────────────┘
       │
       │ 7. Emit WebSocket event
       │    attachment:added
       ▼
┌─────────────────────┐
│  All Clients        │
│  - Update UI        │
│  - Show thumbnail   │
└─────────────────────┘
```

### 3.2 Download Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Click attachment thumbnail/name
       ▼
┌─────────────────────┐
│   Client            │
│  - Show preview OR  │
│  - Request download │
└──────┬──────────────┘
       │
       │ 2. GET /api/attachments/:id/download
       ▼
┌─────────────────────┐
│   Backend           │
│  - Verify access    │
│  - Generate signed  │
│    download URL     │
└──────┬──────────────┘
       │
       │ 3. Return signed URL
       ▼
┌─────────────────────┐
│   Client            │
│  - Open in new tab  │
│    (images/PDFs)    │
│  - Download file    │
│    (others)         │
└─────────────────────┘
```

### 3.3 Delete Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Click delete icon on attachment
       ▼
┌─────────────────────┐
│   Client            │
│  - Show confirm     │
│    dialog           │
└──────┬──────────────┘
       │
       │ 2. Confirm deletion
       │    DELETE /api/attachments/:id
       ▼
┌─────────────────────┐
│   Backend           │
│  - Verify access    │
│    (uploader or     │
│     admin only)     │
│  - Soft delete DB   │
│  - Schedule R2      │
│    deletion (cron)  │
│  - Create activity  │
└──────┬──────────────┘
       │
       │ 3. Emit WebSocket event
       │    attachment:deleted
       ▼
┌─────────────────────┐
│  All Clients        │
│  - Remove from UI   │
└─────────────────────┘
```

### 3.4 Error Flows

#### Upload Failure - Invalid File Type
```
User selects .exe file
  → Client validation fails
  → Show error: "File type not supported"
  → User can select different file
```

#### Upload Failure - File Too Large
```
User selects 50MB file
  → Client validation fails
  → Show error: "File exceeds 10MB limit"
  → User can compress or select smaller file
```

#### Upload Failure - Quota Exceeded
```
User uploads file
  → Backend checks task quota
  → Task already has 45MB of files
  → New file is 8MB (would exceed 50MB limit)
  → Return 413 error
  → Show error: "Task storage limit reached (50MB)"
```

#### Upload Failure - Virus Detected
```
User uploads file
  → File uploads to R2
  → Backend scans file
  → Virus detected
  → Set status to VIRUS_FOUND
  → Delete from R2
  → Show error: "File failed security scan"
```

---

## 4. State Machines

### 4.1 Attachment Status State Machine

```
┌─────────────┐
│  UPLOADING  │ ← Initial state when upload URL requested
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       │ Upload successful                   │ Upload failed
       │ Virus scan passed                   │ OR virus detected
       │                                     │
       ▼                                     ▼
┌─────────────┐                      ┌─────────────┐
│  AVAILABLE  │                      │   FAILED    │
└──────┬──────┘                      │     OR      │
       │                             │VIRUS_FOUND  │
       │ User/Admin                  └─────────────┘
       │ deletes
       │
       ▼
┌─────────────┐
│   DELETED   │ ← Soft delete, file scheduled for removal
└─────────────┘
```

**State Transitions:**

| From        | To          | Trigger                     | Who             |
|-------------|-------------|-----------------------------|-----------------|
| UPLOADING   | AVAILABLE   | Upload complete, scan pass  | System          |
| UPLOADING   | FAILED      | Upload timeout/error        | System          |
| UPLOADING   | VIRUS_FOUND | Virus scan failed           | System          |
| AVAILABLE   | DELETED     | Delete request              | User/Admin      |
| FAILED      | (none)      | Permanent state             | -               |
| VIRUS_FOUND | (none)      | Permanent state             | -               |
| DELETED     | (none)      | Permanent state             | -               |

**Business Rules:**
- Only `AVAILABLE` attachments can be downloaded
- `DELETED` attachments are hidden from UI but retained in DB for 30 days
- `FAILED` and `VIRUS_FOUND` attachments are removed from R2 immediately
- `UPLOADING` status expires after 15 minutes (cleanup job)

---

## 5. System Interactions

### 5.1 Component Interaction Diagram

```
┌──────────────────┐
│  Frontend (Web)  │
└────────┬─────────┘
         │
         │ REST API calls
         │ WebSocket connection
         │
         ▼
┌──────────────────────────────────────────────────┐
│              API Server                          │
│                                                  │
│  ┌────────────────┐    ┌───────────────────┐   │
│  │ Auth Middleware│───▶│ Attachment        │   │
│  └────────────────┘    │ Controller        │   │
│                        └─────────┬─────────┘   │
│                                  │              │
│                        ┌─────────▼─────────┐   │
│                        │ Attachment        │   │
│                        │ Service           │   │
│                        └─────────┬─────────┘   │
│                                  │              │
│         ┌────────────────────────┼──────────┐  │
│         │                        │          │  │
│         ▼                        ▼          ▼  │
│  ┌─────────────┐      ┌──────────────┐  ┌────────────┐
│  │ Storage     │      │ Database     │  │ Activity   │
│  │ Service     │      │ (Prisma)     │  │ Service    │
│  │ (R2 Client) │      └──────────────┘  └────────────┘
│  └─────┬───────┘                                │  │
│        │                                        │  │
└────────┼────────────────────────────────────────┼──┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌──────────────────┐                    ┌─────────────────┐
│  Cloudflare R2   │                    │  PostgreSQL DB  │
│  Object Storage  │                    └─────────────────┘
└──────────────────┘
         │
         │ (Background job)
         ▼
┌──────────────────┐
│  Virus Scanner   │
│  (ClamAV API)    │
└──────────────────┘
```

### 5.2 Sequence Diagrams

#### Complete Upload Sequence

```
Client          API Server      Storage Service      Database       Activity       WebSocket
  │                 │                  │                 │              │              │
  │ 1. Request URL  │                  │                 │              │              │
  ├────────────────▶│                  │                 │              │              │
  │                 │                  │                 │              │              │
  │                 │ 2. Check access  │                 │              │              │
  │                 ├─────────────────────────────────▶  │              │              │
  │                 │                  │                 │              │              │
  │                 │ 3. Generate      │                 │              │              │
  │                 │    presigned URL │                 │              │              │
  │                 ├─────────────────▶│                 │              │              │
  │                 │◀─────────────────┤                 │              │              │
  │                 │                  │                 │              │              │
  │◀────────────────┤ 4. Return URL    │                 │              │              │
  │                 │                  │                 │              │              │
  │ 5. Upload file  │                  │                 │              │              │
  ├──────────────────────────────────▶ R2               │              │              │
  │◀──────────────────────────────────┘                 │              │              │
  │                 │                  │                 │              │              │
  │ 6. Finalize     │                  │                 │              │              │
  ├────────────────▶│                  │                 │              │              │
  │                 │                  │                 │              │              │
  │                 │ 7. Verify upload │                 │              │              │
  │                 ├─────────────────▶│                 │              │              │
  │                 │◀─────────────────┤                 │              │              │
  │                 │                  │                 │              │              │
  │                 │ 8. Scan virus    │                 │              │              │
  │                 ├─────────────────▶│ (async)         │              │              │
  │                 │                  │                 │              │              │
  │                 │ 9. Save to DB    │                 │              │              │
  │                 ├─────────────────────────────────▶  │              │              │
  │                 │                  │                 │              │              │
  │                 │ 10. Log activity │                 │              │              │
  │                 ├──────────────────────────────────────────────────▶│              │
  │                 │                  │                 │              │              │
  │                 │ 11. Broadcast    │                 │              │              │
  │                 ├───────────────────────────────────────────────────────────────▶  │
  │                 │                  │                 │              │              │
  │◀────────────────┤ 12. Return data  │                 │              │              │
  │                 │                  │                 │              │              │
  │◀────────────────────────────────────────────────────────────────────────────────┤
  │                 │                  │                 │              │              │
```

### 5.3 External Service Dependencies

#### Cloudflare R2
- **Purpose:** Object storage for file attachments
- **Operations:**
  - Generate presigned upload URLs
  - Generate presigned download URLs
  - Store original files
  - Store thumbnails
  - Delete objects (cleanup)
- **Configuration:**
  - Bucket name: `teamflow-attachments-[env]`
  - Region: Auto
  - Access: Private (presigned URLs only)
  - CORS: Enabled for upload from client

#### ClamAV (Virus Scanner)
- **Purpose:** Security scanning of uploaded files
- **Integration:** REST API or CLI
- **Timing:** Async after upload completes
- **Failure handling:** Default to FAILED status if scan service unavailable

---

## 6. Security Model

### 6.1 Access Control

**Permission Rules:**

| Action           | Who Can Perform                                    |
|------------------|----------------------------------------------------|
| Upload           | Any workspace member with task read access         |
| View/Download    | Any workspace member with task read access         |
| Delete           | Uploader, Task creator, Workspace ADMIN/OWNER      |
| List attachments | Any workspace member with task read access         |

**Implementation:**
```typescript
async function canAccessAttachment(userId: string, taskId: string): Promise<boolean> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: { userId }
          }
        }
      }
    }
  });

  return !!task;
}

async function canDeleteAttachment(userId: string, attachmentId: string): Promise<boolean> {
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      OR: [
        { uploadedBy: userId },  // Uploader
        { task: { createdBy: userId } },  // Task creator
        { task: {
            project: {
              workspace: {
                members: {
                  some: {
                    userId,
                    role: { in: ['OWNER', 'ADMIN'] }
                  }
                }
              }
            }
          }
        }
      ]
    }
  });

  return !!attachment;
}
```

### 6.2 File Validation

**Client-side validation:**
1. Check file type against allowed MIME types
2. Check file size < 10MB
3. Calculate SHA256 checksum
4. Validate filename (sanitize special chars)

**Server-side validation:**
1. Re-validate MIME type (don't trust client)
2. Re-validate file size
3. Check task storage quota
4. Verify checksum matches uploaded file
5. Scan for viruses (async)

### 6.3 Signed URLs

**Upload URLs:**
- Validity: 15 minutes
- Single use (one PUT request)
- Scoped to specific object key
- Generated server-side only

**Download URLs:**
- Validity: 1 hour
- Multiple use (same file can be downloaded multiple times)
- Generated on-demand per request
- Include content-disposition header for proper filename

**Security considerations:**
- URLs contain cryptographic signatures
- Cannot be tampered with
- Expire automatically
- No permanent public access

### 6.4 Virus Scanning

**Process:**
1. File uploaded to R2
2. Async job picks up new uploads
3. Download file to temporary location
4. Run ClamAV scan
5. Update attachment status based on result
6. Delete file from R2 if virus found
7. Notify uploader if virus found

**Configuration:**
```typescript
export const VIRUS_SCAN_CONFIG = {
  enabled: process.env.VIRUS_SCAN_ENABLED === 'true',
  timeout: 60000,  // 60 seconds
  maxFileSize: 10 * 1024 * 1024,  // Only scan files < 10MB
  apiUrl: process.env.CLAMAV_API_URL,
};
```

---

## 7. Storage Strategy

### 7.1 Storage Structure

**Cloudflare R2 Bucket Structure:**
```
teamflow-attachments-production/
├── attachments/
│   ├── task-{taskId}/
│   │   ├── {uuid}.{ext}
│   │   ├── {uuid}.{ext}
│   │   └── ...
│   └── ...
├── thumbnails/
│   ├── task-{taskId}/
│   │   ├── {uuid}_thumb.{ext}
│   │   └── ...
│   └── ...
└── temp/
    └── {uuid}-{timestamp}.{ext}  (cleanup after 24h)
```

**Storage Key Format:**
- Original file: `attachments/task-{taskId}/{uuid}.{ext}`
- Thumbnail: `thumbnails/task-{taskId}/{uuid}_thumb.jpg`
- Temporary: `temp/{uuid}-{timestamp}.{ext}`

### 7.2 Thumbnail Generation

**For image files only:**
```typescript
export const THUMBNAIL_CONFIG = {
  mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  dimensions: {
    width: 300,
    height: 300,
  },
  format: 'jpeg',  // Convert all to JPEG
  quality: 80,
  fit: 'cover',  // Crop to fill
};
```

**Implementation:**
- Use Sharp library for image processing
- Generate thumbnail after successful upload
- Store in separate R2 path
- Fallback to original URL if thumbnail generation fails

### 7.3 Cleanup Strategy

**Soft-deleted attachments:**
- Keep in DB with `deletedAt` timestamp
- Keep in R2 for 30 days (recovery period)
- Cron job runs daily to purge files > 30 days old
- Hard delete from DB after 90 days

**Failed/abandoned uploads:**
- Cron job runs hourly
- Find attachments with status=UPLOADING older than 15 minutes
- Delete from R2 and DB

**Orphaned files:**
- Weekly job to find R2 files without DB records
- Delete after verification

### 7.4 Quota Management

**Per-task limits:**
```typescript
async function checkTaskQuota(taskId: string, newFileSize: number): Promise<void> {
  const result = await prisma.attachment.aggregate({
    where: {
      taskId,
      status: 'AVAILABLE',
    },
    _sum: {
      size: true,
    },
  });

  const currentSize = result._sum.size || 0;
  const maxSize = ATTACHMENT_CONSTRAINTS.MAX_TASK_STORAGE;

  if (currentSize + newFileSize > maxSize) {
    throw new Error(`Task storage limit exceeded (${maxSize} bytes)`);
  }
}
```

**Future: Per-workspace limits**
```typescript
// To be implemented in later phase
async function checkWorkspaceQuota(workspaceId: string, newFileSize: number): Promise<void> {
  // Similar to task quota but at workspace level
  // Can be tied to subscription plan
}
```

---

## 8. Migration Plan

### 8.1 Database Migration

**File:** `packages/database/prisma/migrations/XXX_add_attachment_enhancements.sql`

```sql
-- Add new enum for attachment status
CREATE TYPE "AttachmentStatus" AS ENUM ('UPLOADING', 'AVAILABLE', 'FAILED', 'DELETED', 'VIRUS_FOUND');

-- Add new activity actions
ALTER TYPE "ActivityAction" ADD VALUE 'ATTACHMENT_ADDED';
ALTER TYPE "ActivityAction" ADD VALUE 'ATTACHMENT_DELETED';

-- Add new entity type
ALTER TYPE "EntityType" ADD VALUE 'ATTACHMENT';

-- Alter attachments table
ALTER TABLE "attachments" ADD COLUMN "originalName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "attachments" ADD COLUMN "storageKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "attachments" ADD COLUMN "status" "AttachmentStatus" NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "attachments" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "attachments" ADD COLUMN "metadata" JSONB DEFAULT '{}';
ALTER TABLE "attachments" ADD COLUMN "checksum" TEXT;
ALTER TABLE "attachments" ADD COLUMN "virusScanAt" TIMESTAMP;
ALTER TABLE "attachments" ADD COLUMN "virusScanResult" TEXT;
ALTER TABLE "attachments" ADD COLUMN "deletedAt" TIMESTAMP;
ALTER TABLE "attachments" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "attachments" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Create indexes
CREATE INDEX "attachments_status_idx" ON "attachments"("status");
CREATE INDEX "attachments_createdAt_idx" ON "attachments"("createdAt");

-- Backfill existing attachments
UPDATE "attachments" SET
  "originalName" = "filename",
  "storageKey" = "url",
  "status" = 'AVAILABLE',
  "updatedAt" = NOW()
WHERE "originalName" = '';
```

### 8.2 Data Migration

**For existing attachments in database:**
1. Set `originalName` = `filename`
2. Set `storageKey` = `url` (or extract from URL)
3. Set `status` = 'AVAILABLE'
4. Leave new fields as NULL (will populate as used)

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Files to create:**
- `attachment.service.test.ts` - Business logic tests
- `attachment.controller.test.ts` - HTTP handler tests
- `storage.service.test.ts` - R2 client tests

**Test cases:**
- ✓ Generate upload URL with valid input
- ✓ Reject oversized files
- ✓ Reject invalid MIME types
- ✓ Check task quota before upload
- ✓ Create attachment record after upload
- ✓ Generate thumbnails for images
- ✓ Soft delete attachments
- ✓ Verify access permissions
- ✓ Handle virus scan results

### 9.2 Integration Tests

**Test cases:**
- ✓ Complete upload flow (request URL → upload → finalize)
- ✓ Download flow with signed URLs
- ✓ Delete flow with WebSocket broadcast
- ✓ Quota enforcement
- ✓ Access control (unauthorized access blocked)
- ✓ Concurrent uploads to same task

### 9.3 E2E Tests

**Using Playwright:**
- ✓ Drag and drop file to task
- ✓ Click upload button and select file
- ✓ See upload progress bar
- ✓ See attachment appear in list
- ✓ Click attachment to preview/download
- ✓ Delete attachment
- ✓ Error handling for invalid files

---

## 10. Acceptance Criteria

Phase 2 (Model) is complete when:

- ✅ All data models documented
- ✅ Database schema changes defined
- ✅ API contracts specified with request/response examples
- ✅ User flows mapped for happy path and error cases
- ✅ State machine defined for attachment lifecycle
- ✅ System interaction diagrams created
- ✅ Security model documented
- ✅ Storage strategy finalized
- ✅ Migration plan written
- ✅ Testing strategy outlined

**Next Phase:** Architecture (Week 1, Days 3-4)
- Choose storage provider and set up
- Design detailed system architecture
- Create implementation plan
- Set up development environment

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Author:** AI Assistant
**Reviewers:** [Pending]
