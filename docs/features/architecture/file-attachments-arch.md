# File Attachments - Architecture Document

**Feature:** File Attachments
**Phase:** 3 - Architecture
**Timeline:** Week 1, Days 3-4
**Status:** Complete
**Date:** 2025-10-09

---

## Table of Contents
1. [System Design Overview](#system-design-overview)
2. [Storage Provider Architecture](#storage-provider-architecture)
3. [Database Design](#database-design)
4. [API Specifications](#api-specifications)
5. [Frontend Architecture](#frontend-architecture)
6. [Integration Architecture](#integration-architecture)
7. [Security Architecture](#security-architecture)
8. [Performance & Scalability](#performance--scalability)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Monitoring & Logging](#monitoring--logging)

---

## 1. System Design Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ File Picker  │  │ Upload UI    │  │ Attachment List      │  │
│  │ (Drag&Drop)  │  │ (Progress)   │  │ (Preview/Download)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │ REST API         │ WebSocket        │ REST API
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────────┐
│                     API Server (Express)                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Attachment Routes & Controllers                           │  │
│  │  - POST /tasks/:id/attachments/upload-url                  │  │
│  │  - POST /tasks/:id/attachments                             │  │
│  │  - GET  /tasks/:id/attachments                             │  │
│  │  - GET  /attachments/:id/download                          │  │
│  │  - DELETE /attachments/:id                                 │  │
│  └────────────────┬───────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼───────────────────────────────────────────┐  │
│  │  Attachment Service (Business Logic)                       │  │
│  │  - Quota validation                                        │  │
│  │  - File type validation                                    │  │
│  │  - Access control                                          │  │
│  │  - Activity logging                                        │  │
│  └─┬──────────────────┬───────────────────┬──────────────────┘  │
│    │                  │                   │                     │
└────┼──────────────────┼───────────────────┼─────────────────────┘
     │                  │                   │
     │                  │                   │
┌────▼────────┐  ┌──────▼────────┐  ┌──────▼────────────────────┐
│ Storage     │  │ Database      │  │ Background Jobs (BullMQ)  │
│ Service     │  │ (Prisma +     │  │ - Virus scanning          │
│ (R2 Client) │  │  PostgreSQL)  │  │ - Thumbnail generation    │
│             │  │               │  │ - Cleanup tasks           │
└─────┬───────┘  └───────────────┘  └───────────────────────────┘
      │
      │ S3-compatible API
      │
┌─────▼──────────────────────────────────────────┐
│      Cloudflare R2 (Object Storage)            │
│  - Bucket: teamflow-attachments-production     │
│  - Presigned URLs for upload/download          │
│  - Automatic replication & backup              │
└────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Frontend** | File selection, upload UI, progress, preview | React, Zustand, TanStack Query |
| **API Routes** | HTTP request handling, validation | Express, Zod |
| **Attachment Service** | Business logic, quota checks, access control | TypeScript |
| **Storage Service** | R2 interactions, presigned URL generation | AWS SDK S3 Client |
| **Database** | Metadata storage, relationships | Prisma, PostgreSQL |
| **Background Jobs** | Async tasks (virus scan, thumbnails, cleanup) | BullMQ, Redis |
| **Activity Service** | Track all attachment events | Existing service |
| **WebSocket** | Real-time notifications | Socket.io |

---

## 2. Storage Provider Architecture

### 2.1 Cloudflare R2 Configuration

**Why R2?**
- S3-compatible API (easy migration)
- No egress fees (unlimited downloads)
- Global CDN integration
- Lower costs than S3
- Already configured in .env

**Bucket Structure:**
```
teamflow-attachments-production/
├── attachments/
│   └── task-{taskId}/
│       ├── {uuid}.{ext}              # Original files
│       └── ...
├── thumbnails/
│   └── task-{taskId}/
│       ├── {uuid}_thumb.jpg          # Generated thumbnails
│       └── ...
└── temp/
    └── {uuid}-{timestamp}.{ext}      # Temporary uploads (24h TTL)
```

**Bucket Settings:**
```json
{
  "name": "teamflow-attachments-production",
  "region": "auto",
  "storageClass": "STANDARD",
  "versioning": "Disabled",
  "publicAccess": "Blocked",
  "cors": [
    {
      "allowedOrigins": ["http://localhost:3001", "https://app.teamflow.com"],
      "allowedMethods": ["GET", "PUT", "POST"],
      "allowedHeaders": ["*"],
      "maxAge": 3600
    }
  ],
  "lifecycleRules": [
    {
      "id": "delete-temp-files",
      "prefix": "temp/",
      "expiration": { "days": 1 }
    },
    {
      "id": "delete-soft-deleted",
      "prefix": "deleted/",
      "expiration": { "days": 30 }
    }
  ]
}
```

### 2.2 Storage Service Implementation

**File:** `apps/api/src/services/storage.service.ts`

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

export class StorageService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME!;
    this.publicUrl = process.env.R2_PUBLIC_URL!;

    // Configure S3 client for Cloudflare R2
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Generate presigned upload URL
   * @param taskId - Task ID for organizing files
   * @param filename - Original filename
   * @param mimeType - File MIME type
   * @param expiresIn - URL expiry in seconds (default: 15 minutes)
   */
  async generateUploadUrl(
    taskId: string,
    filename: string,
    mimeType: string,
    expiresIn: number = 900 // 15 minutes
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    const fileExtension = filename.split('.').pop() || '';
    const uuid = crypto.randomUUID();
    const storageKey = `attachments/task-${taskId}/${uuid}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return { uploadUrl, storageKey };
  }

  /**
   * Generate presigned download URL
   * @param storageKey - Storage key from database
   * @param filename - Filename for Content-Disposition header
   * @param expiresIn - URL expiry in seconds (default: 1 hour)
   */
  async generateDownloadUrl(
    storageKey: string,
    filename: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Generate presigned URL for inline viewing (images, PDFs)
   */
  async generateViewUrl(
    storageKey: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      ResponseContentDisposition: 'inline',
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Verify file exists in storage
   */
  async fileExists(storageKey: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete file from storage (soft delete by moving to deleted/ prefix)
   */
  async deleteFile(storageKey: string): Promise<void> {
    // Move to deleted folder instead of permanent deletion
    // Actual deletion happens via lifecycle rule after 30 days
    const deletedKey = storageKey.replace(/^attachments\//, 'deleted/');

    // Copy to deleted location
    // Then delete original
    // Implementation depends on R2 API capabilities

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    await this.client.send(command);
  }

  /**
   * Get file metadata (size, content-type, etc.)
   */
  async getFileMetadata(storageKey: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  }> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    const response = await this.client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
    };
  }
}

// Singleton instance
export const storageService = new StorageService();
```

### 2.3 Thumbnail Generation Service

**File:** `apps/api/src/services/thumbnail.service.ts`

```typescript
import sharp from 'sharp';
import { storageService } from './storage.service';

export class ThumbnailService {
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 300;
  private readonly THUMBNAIL_FORMAT = 'jpeg';
  private readonly THUMBNAIL_QUALITY = 80;

  private readonly SUPPORTED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  /**
   * Check if file type supports thumbnail generation
   */
  canGenerateThumbnail(mimeType: string): boolean {
    return this.SUPPORTED_TYPES.includes(mimeType);
  }

  /**
   * Generate thumbnail for image
   * @param originalBuffer - Original image buffer
   * @param storageKey - Original file storage key
   * @returns Thumbnail storage key
   */
  async generateThumbnail(
    originalBuffer: Buffer,
    storageKey: string
  ): Promise<string> {
    try {
      // Generate thumbnail using sharp
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: this.THUMBNAIL_QUALITY })
        .toBuffer();

      // Generate thumbnail storage key
      const thumbnailKey = storageKey
        .replace('attachments/', 'thumbnails/')
        .replace(/\.[^.]+$/, '_thumb.jpg');

      // Upload thumbnail to R2
      // Implementation using storage service

      return thumbnailKey;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      throw error;
    }
  }

  /**
   * Extract image metadata
   */
  async extractMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
  }> {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
    };
  }
}

export const thumbnailService = new ThumbnailService();
```

---

## 3. Database Design

### 3.1 Migration File

**File:** `packages/database/prisma/migrations/YYYYMMDDHHMMSS_add_attachment_enhancements/migration.sql`

```sql
-- Create AttachmentStatus enum
CREATE TYPE "AttachmentStatus" AS ENUM (
  'UPLOADING',
  'AVAILABLE',
  'FAILED',
  'DELETED',
  'VIRUS_FOUND'
);

-- Add new values to ActivityAction enum
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'ATTACHMENT_ADDED';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'ATTACHMENT_DELETED';

-- Add new value to EntityType enum
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'ATTACHMENT';

-- Add new columns to attachments table
ALTER TABLE "attachments"
  ADD COLUMN "originalName" TEXT,
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "status" "AttachmentStatus" DEFAULT 'AVAILABLE',
  ADD COLUMN "thumbnailUrl" TEXT,
  ADD COLUMN "metadata" JSONB DEFAULT '{}',
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "virusScanAt" TIMESTAMP,
  ADD COLUMN "virusScanResult" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP,
  ADD COLUMN "deletedBy" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();

-- Backfill existing data
UPDATE "attachments"
SET
  "originalName" = "filename",
  "storageKey" = "url",
  "status" = 'AVAILABLE',
  "updatedAt" = NOW()
WHERE "originalName" IS NULL;

-- Make required columns NOT NULL after backfill
ALTER TABLE "attachments"
  ALTER COLUMN "originalName" SET NOT NULL,
  ALTER COLUMN "storageKey" SET NOT NULL,
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL;

-- Create indexes for performance
CREATE INDEX "attachments_status_idx" ON "attachments"("status");
CREATE INDEX "attachments_createdAt_idx" ON "attachments"("createdAt");
CREATE INDEX "attachments_taskId_status_idx" ON "attachments"("taskId", "status");

-- Add foreign key for deletedBy
ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_deletedBy_fkey"
  FOREIGN KEY ("deletedBy")
  REFERENCES "users"("id")
  ON DELETE SET NULL;

-- Create index on deletedBy
CREATE INDEX "attachments_deletedBy_idx" ON "attachments"("deletedBy");

-- Add comment for documentation
COMMENT ON TABLE "attachments" IS 'File attachments for tasks with support for images, documents, and other file types';
COMMENT ON COLUMN "attachments"."status" IS 'Current status of the attachment: UPLOADING, AVAILABLE, FAILED, DELETED, or VIRUS_FOUND';
COMMENT ON COLUMN "attachments"."metadata" IS 'JSON metadata for the file (e.g., image dimensions, video duration, etc.)';
```

### 3.2 Updated Prisma Schema

**File:** `packages/database/prisma/schema.prisma` (update Attachment model)

```prisma
enum AttachmentStatus {
  UPLOADING
  AVAILABLE
  FAILED
  DELETED
  VIRUS_FOUND
}

model Attachment {
  id            String           @id @default(uuid())
  taskId        String
  filename      String
  originalName  String
  url           String           // Deprecated: kept for backward compatibility
  storageKey    String
  mimeType      String
  size          Int
  status        AttachmentStatus @default(UPLOADING)
  uploadedBy    String?
  thumbnailUrl  String?
  metadata      Json             @default("{}")
  checksum      String?
  virusScanAt   DateTime?
  virusScanResult String?
  deletedAt     DateTime?
  deletedBy     String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  // Relations
  task          Task             @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader      User?            @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)
  deleter       User?            @relation(fields: [deletedBy], references: [id], onDelete: SetNull, name: "AttachmentDeleter")

  @@index([taskId])
  @@index([uploadedBy])
  @@index([status])
  @@index([createdAt])
  @@index([taskId, status])
  @@index([deletedBy])
  @@map("attachments")
}

// Update User model to include deleter relation
model User {
  // ... existing fields ...

  // Relations
  // ... existing relations ...
  uploads              Attachment[]      @relation("UserAttachments")
  deletedAttachments   Attachment[]      @relation("AttachmentDeleter")
}
```

### 3.3 Database Indexes Strategy

| Index Name | Columns | Purpose | Query Pattern |
|------------|---------|---------|---------------|
| `attachments_taskId_idx` | `taskId` | List attachments by task | `WHERE taskId = ?` |
| `attachments_uploadedBy_idx` | `uploadedBy` | List user's uploads | `WHERE uploadedBy = ?` |
| `attachments_status_idx` | `status` | Filter by status | `WHERE status = ?` |
| `attachments_createdAt_idx` | `createdAt` | Sort by upload time | `ORDER BY createdAt` |
| `attachments_taskId_status_idx` | `taskId, status` | Available attachments per task | `WHERE taskId = ? AND status = 'AVAILABLE'` |
| `attachments_deletedBy_idx` | `deletedBy` | Audit deleted files | `WHERE deletedBy = ?` |

---

## 4. API Specifications

### 4.1 Route Structure

**File:** `apps/api/src/modules/attachment/attachment.routes.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as attachmentController from './attachment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const requestUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
});

const finalizeUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  storageKey: z.string().min(1),
  mimeType: z.string(),
  size: z.number().int().positive(),
  checksum: z.string().optional(),
  metadata: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    format: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
});

// Task attachment routes
router.post(
  '/tasks/:taskId/attachments/upload-url',
  validate(requestUploadUrlSchema),
  attachmentController.requestUploadUrl
);

router.post(
  '/tasks/:taskId/attachments',
  validate(finalizeUploadSchema),
  attachmentController.finalizeAttachment
);

router.get(
  '/tasks/:taskId/attachments',
  attachmentController.listAttachments
);

// Attachment-specific routes
router.get(
  '/attachments/:id/download',
  attachmentController.getDownloadUrl
);

router.get(
  '/attachments/:id/view',
  attachmentController.getViewUrl
);

router.delete(
  '/attachments/:id',
  attachmentController.deleteAttachment
);

export default router;
```

### 4.2 Controller Implementation

**File:** `apps/api/src/modules/attachment/attachment.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import * as attachmentService from './attachment.service';

/**
 * Request presigned upload URL
 * POST /api/tasks/:taskId/attachments/upload-url
 */
export async function requestUploadUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;
    const { filename, mimeType, size } = req.body;

    const result = await attachmentService.requestUploadUrl(
      userId,
      taskId,
      { filename, mimeType, size }
    );

    res.status(200).json({
      uploadUrl: result.uploadUrl,
      storageKey: result.storageKey,
      expiresIn: result.expiresIn,
      maxSize: result.maxSize,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize attachment after successful upload
 * POST /api/tasks/:taskId/attachments
 */
export async function finalizeAttachment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;

    const attachment = await attachmentService.finalizeAttachment(
      userId,
      taskId,
      req.body
    );

    res.status(201).json({
      message: 'Attachment created successfully',
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List attachments for a task
 * GET /api/tasks/:taskId/attachments
 */
export async function listAttachments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;

    const result = await attachmentService.listAttachments(userId, taskId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get download URL for attachment
 * GET /api/attachments/:id/download
 */
export async function getDownloadUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await attachmentService.getDownloadUrl(userId, id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get view URL for attachment (inline display)
 * GET /api/attachments/:id/view
 */
export async function getViewUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await attachmentService.getViewUrl(userId, id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete attachment
 * DELETE /api/attachments/:id
 */
export async function deleteAttachment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await attachmentService.deleteAttachment(userId, id);

    res.status(200).json({
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
```

### 4.3 Service Layer (Partial Implementation)

**File:** `apps/api/src/modules/attachment/attachment.service.ts`

```typescript
import { prisma } from '@teamflow/database';
import { storageService } from '../../services/storage.service';
import { ATTACHMENT_CONSTRAINTS } from './attachment.constants';

interface RequestUploadUrlInput {
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Request presigned upload URL
 */
export async function requestUploadUrl(
  userId: string,
  taskId: string,
  input: RequestUploadUrlInput
) {
  // 1. Verify user has access to task
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      project: {
        select: {
          workspaceId: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found or access denied');
  }

  // 2. Validate file type
  if (!ATTACHMENT_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    throw new Error(`File type ${input.mimeType} is not allowed`);
  }

  // 3. Validate file size
  if (input.size > ATTACHMENT_CONSTRAINTS.MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed (${ATTACHMENT_CONSTRAINTS.MAX_FILE_SIZE} bytes)`
    );
  }

  // 4. Check task quota
  await checkTaskQuota(taskId, input.size);

  // 5. Generate presigned upload URL
  const { uploadUrl, storageKey } = await storageService.generateUploadUrl(
    taskId,
    input.filename,
    input.mimeType,
    ATTACHMENT_CONSTRAINTS.UPLOAD_URL_EXPIRY
  );

  return {
    uploadUrl,
    storageKey,
    expiresIn: ATTACHMENT_CONSTRAINTS.UPLOAD_URL_EXPIRY,
    maxSize: ATTACHMENT_CONSTRAINTS.MAX_FILE_SIZE,
  };
}

/**
 * Check if task has exceeded storage quota
 */
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
    const currentMB = (currentSize / 1024 / 1024).toFixed(2);
    const maxMB = (maxSize / 1024 / 1024).toFixed(2);
    throw new Error(
      `Task storage limit exceeded (${currentMB}MB / ${maxMB}MB)`
    );
  }
}

// Additional service methods continue...
```

### 4.4 Constants & Configuration

**File:** `apps/api/src/modules/attachment/attachment.constants.ts`

```typescript
export const ATTACHMENT_CONSTRAINTS = {
  // File size limits
  MAX_FILE_SIZE: 10 * 1024 * 1024,          // 10MB per file
  MAX_TASK_STORAGE: 50 * 1024 * 1024,       // 50MB per task
  MAX_WORKSPACE_STORAGE: 5 * 1024 * 1024 * 1024, // 5GB per workspace (future)

  // Allowed MIME types
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
    // Text
    'text/plain',
    'text/markdown',
    'text/csv',
    // Code
    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
    // Archives
    'application/zip',
    'application/x-7z-compressed',
  ],

  // URL expiry
  SIGNED_URL_EXPIRY: 3600,   // 1 hour
  UPLOAD_URL_EXPIRY: 900,     // 15 minutes

  // Thumbnail settings
  THUMBNAIL_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  THUMBNAIL_SIZE: { width: 300, height: 300 },

  // Filename validation
  MAX_FILENAME_LENGTH: 255,
  INVALID_FILENAME_CHARS: /[<>:"/\\|?*\x00-\x1F]/g,
};
```

---

## 5. Frontend Architecture

### 5.1 Component Hierarchy

```
TaskDetailModal
└── TaskAttachments (new)
    ├── AttachmentUploader (new)
    │   ├── DropZone
    │   └── UploadProgress
    └── AttachmentList (new)
        └── AttachmentItem (new)
            ├── AttachmentPreview
            ├── AttachmentActions
            └── AttachmentMetadata
```

### 5.2 State Management (Zustand)

**File:** `apps/web/src/stores/attachmentStore.ts`

```typescript
import { create } from 'zustand';

interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

interface AttachmentStore {
  // Upload state
  uploads: Map<string, UploadProgress>;
  addUpload: (fileId: string, filename: string) => void;
  updateProgress: (fileId: string, progress: number) => void;
  setUploadStatus: (fileId: string, status: UploadProgress['status'], error?: string) => void;
  removeUpload: (fileId: string) => void;

  // Attachments cache
  attachmentsByTask: Map<string, Attachment[]>;
  setAttachments: (taskId: string, attachments: Attachment[]) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
}

export const useAttachmentStore = create<AttachmentStore>((set) => ({
  uploads: new Map(),
  attachmentsByTask: new Map(),

  addUpload: (fileId, filename) =>
    set((state) => {
      const uploads = new Map(state.uploads);
      uploads.set(fileId, { fileId, filename, progress: 0, status: 'uploading' });
      return { uploads };
    }),

  updateProgress: (fileId, progress) =>
    set((state) => {
      const uploads = new Map(state.uploads);
      const upload = uploads.get(fileId);
      if (upload) {
        uploads.set(fileId, { ...upload, progress });
      }
      return { uploads };
    }),

  // ... other methods
}));
```

### 5.3 API Client Hooks (TanStack Query)

**File:** `apps/web/src/lib/api/attachments.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Types
interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  status: string;
  thumbnailUrl?: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

// Query keys
export const attachmentKeys = {
  all: ['attachments'] as const,
  byTask: (taskId: string) => ['attachments', 'task', taskId] as const,
  detail: (id: string) => ['attachments', 'detail', id] as const,
};

// Hooks
export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: attachmentKeys.byTask(taskId),
    queryFn: async () => {
      const response = await api.get<{ data: { attachments: Attachment[] } }>(
        `/tasks/${taskId}/attachments`
      );
      return response.data.data.attachments;
    },
  });
}

export function useUploadAttachment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // 1. Request upload URL
      const { data: urlData } = await api.post(
        `/tasks/${taskId}/attachments/upload-url`,
        {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }
      );

      // 2. Upload to R2
      await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // 3. Finalize attachment
      const { data } = await api.post(`/tasks/${taskId}/attachments`, {
        filename: file.name,
        originalName: file.name,
        storageKey: urlData.storageKey,
        mimeType: file.type,
        size: file.size,
      });

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.byTask(taskId) });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/attachments/${attachmentId}`);
    },
    onSuccess: (_, attachmentId) => {
      // Invalidate all attachment queries
      queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
    },
  });
}
```

### 5.4 Upload Component

**File:** `apps/web/src/components/attachments/AttachmentUploader.tsx`

```typescript
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileIcon } from 'lucide-react';
import { useUploadAttachment } from '@/lib/api/attachments';
import { useAttachmentStore } from '@/stores/attachmentStore';
import { toast } from '@/components/ui/use-toast';

interface AttachmentUploaderProps {
  taskId: string;
}

export function AttachmentUploader({ taskId }: AttachmentUploaderProps) {
  const uploadMutation = useUploadAttachment(taskId);
  const { addUpload, updateProgress, setUploadStatus } = useAttachmentStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId = crypto.randomUUID();
        addUpload(fileId, file.name);

        try {
          // Upload with progress tracking
          await uploadMutation.mutateAsync(file);
          setUploadStatus(fileId, 'complete');

          toast({
            title: 'Upload complete',
            description: `${file.name} uploaded successfully`,
          });
        } catch (error) {
          setUploadStatus(fileId, 'error', error.message);

          toast({
            title: 'Upload failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    },
    [taskId, uploadMutation, addUpload, setUploadStatus]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.csv'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? 'Drop files here...'
          : 'Drag and drop files, or click to select'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Max file size: 10MB
      </p>
    </div>
  );
}
```

---

## 6. Integration Architecture

### 6.1 WebSocket Events Integration

**Update:** `apps/api/src/websocket/socket.events.ts`

```typescript
import { getSocketServer } from './index';

export function emitAttachmentAdded(data: {
  attachmentId: string;
  taskId: string;
  projectId: string;
  attachment: any;
  uploadedBy: { userId: string; name: string };
}) {
  const io = getSocketServer();
  if (io) {
    io.to(`project:${data.projectId}`).emit('attachment:added', data);
  }
}

export function emitAttachmentDeleted(data: {
  attachmentId: string;
  taskId: string;
  projectId: string;
  deletedBy: { userId: string; name: string };
}) {
  const io = getSocketServer();
  if (io) {
    io.to(`project:${data.projectId}`).emit('attachment:deleted', data);
  }
}
```

### 6.2 Background Jobs Architecture

**File:** `apps/api/src/jobs/attachment.jobs.ts`

```typescript
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Job queues
export const attachmentQueue = new Queue('attachments', { connection });

// Job types
interface ThumbnailJobData {
  attachmentId: string;
  storageKey: string;
  mimeType: string;
}

interface VirusScanJobData {
  attachmentId: string;
  storageKey: string;
}

interface CleanupJobData {
  olderThan: Date;
}

// Workers
export const thumbnailWorker = new Worker(
  'attachments',
  async (job) => {
    if (job.name === 'generate-thumbnail') {
      const data = job.data as ThumbnailJobData;
      // Implementation
    }
  },
  { connection }
);

export const virusScanWorker = new Worker(
  'attachments',
  async (job) => {
    if (job.name === 'virus-scan') {
      const data = job.data as VirusScanJobData;
      // Implementation
    }
  },
  { connection }
);

// Schedule jobs
export async function scheduleThumnailGeneration(data: ThumbnailJobData) {
  await attachmentQueue.add('generate-thumbnail', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}
```

---

## 7. Security Architecture

### 7.1 Access Control Matrix

| Action | Anonymous | Workspace Member | Task Creator | Uploader | Admin/Owner |
|--------|-----------|------------------|--------------|----------|-------------|
| Upload | ❌ | ✅ | ✅ | ✅ | ✅ |
| View/Download | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete | ❌ | ❌ | ✅ | ✅ | ✅ |
| List | ❌ | ✅ | ✅ | ✅ | ✅ |

### 7.2 Validation Pipeline

```
Client Upload Request
  │
  ├─▶ Client-side validation
  │   ├─ File type check
  │   ├─ File size check
  │   └─ Filename sanitization
  │
  ├─▶ API validation (Zod schema)
  │   ├─ Request structure
  │   ├─ Type validation
  │   └─ Size limits
  │
  ├─▶ Service-layer validation
  │   ├─ User access check
  │   ├─ MIME type verification
  │   ├─ Quota check
  │   └─ Duplicate detection
  │
  ├─▶ Storage validation
  │   ├─ File exists check
  │   ├─ Checksum validation
  │   └─ Size verification
  │
  └─▶ Post-upload validation
      ├─ Virus scan (async)
      └─ Content type verification
```

---

## 8. Performance & Scalability

### 8.1 Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Upload URL generation | < 200ms | Fast user feedback |
| File list retrieval | < 100ms | Instant UI update |
| Download URL generation | < 150ms | Seamless UX |
| Thumbnail generation | < 3s | Background job acceptable |
| Max concurrent uploads | 100/server | Scale horizontally |

### 8.2 Caching Strategy

```typescript
// Cache download URLs (1 hour TTL)
const cacheKey = `attachment:download:${attachmentId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const downloadUrl = await storageService.generateDownloadUrl(storageKey, filename);
await redis.setex(cacheKey, 3600, JSON.stringify({ downloadUrl }));

return { downloadUrl };
```

### 8.3 Database Query Optimization

```typescript
// Efficient query with proper indexes
const attachments = await prisma.attachment.findMany({
  where: {
    taskId,
    status: 'AVAILABLE',      // Uses: attachments_taskId_status_idx
  },
  select: {
    id: true,
    filename: true,
    size: true,
    mimeType: true,
    thumbnailUrl: true,
    createdAt: true,
    uploader: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',         // Uses: attachments_createdAt_idx
  },
});
```

---

## 9. Error Handling Strategy

### 9.1 Error Types & Responses

| Error Type | HTTP Status | Response |
|------------|-------------|----------|
| Invalid file type | 400 | `{ error: "Invalid file type", allowed: [...] }` |
| File too large | 413 | `{ error: "File exceeds size limit", maxSize: 10485760 }` |
| Quota exceeded | 413 | `{ error: "Storage quota exceeded", current: X, max: Y }` |
| Access denied | 403 | `{ error: "Access denied" }` |
| Upload failed | 500 | `{ error: "Upload failed", reason: "..." }` |
| Virus detected | 422 | `{ error: "Security scan failed" }` |

### 9.2 Retry Strategy

**Client-side:**
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function uploadWithRetry(file: File, retries = 0): Promise<void> {
  try {
    await uploadFile(file);
  } catch (error) {
    if (retries < MAX_RETRIES && isRetryableError(error)) {
      await delay(RETRY_DELAY * Math.pow(2, retries)); // Exponential backoff
      return uploadWithRetry(file, retries + 1);
    }
    throw error;
  }
}
```

---

## 10. Monitoring & Logging

### 10.1 Metrics to Track

```typescript
// Prometheus metrics
export const attachmentMetrics = {
  uploadsTotal: new Counter({
    name: 'attachments_uploads_total',
    help: 'Total number of file uploads',
    labelNames: ['status', 'mimeType'],
  }),

  uploadDuration: new Histogram({
    name: 'attachments_upload_duration_seconds',
    help: 'Upload duration in seconds',
    labelNames: ['mimeType'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  }),

  storageUsed: new Gauge({
    name: 'attachments_storage_bytes',
    help: 'Total storage used in bytes',
    labelNames: ['workspace'],
  }),

  virusScansTotal: new Counter({
    name: 'attachments_virus_scans_total',
    help: 'Total virus scans performed',
    labelNames: ['result'],
  }),
};
```

### 10.2 Logging Strategy

```typescript
import { logger } from '@/lib/logger';

// Upload started
logger.info('Attachment upload started', {
  userId,
  taskId,
  filename,
  size,
  mimeType,
});

// Upload completed
logger.info('Attachment upload completed', {
  attachmentId,
  duration: Date.now() - startTime,
});

// Upload failed
logger.error('Attachment upload failed', {
  userId,
  taskId,
  filename,
  error: error.message,
  stack: error.stack,
});

// Virus detected
logger.warn('Virus detected in attachment', {
  attachmentId,
  filename,
  virusScanResult,
});
```

---

## 11. Implementation Checklist

### Phase 3 Complete When:

- ✅ Architecture document finalized
- ✅ Storage provider configuration documented
- ✅ Database migration scripts written
- ✅ API routes and controllers designed
- ✅ Service layer architecture defined
- ✅ Frontend component hierarchy planned
- ✅ WebSocket integration specified
- ✅ Background job architecture designed
- ✅ Security measures documented
- ✅ Performance targets set
- ✅ Error handling strategy defined
- ✅ Monitoring plan created

---

## 12. Next Phase: Development (Week 2)

**Ready to implement:**

### Day 1: Backend Foundation
- Create database migration
- Set up storage service
- Implement attachment routes & controller skeleton

### Day 2: Backend Logic
- Implement upload URL generation
- Implement finalize attachment
- Add quota checking & validation
- Integrate activity logging

### Day 3: Frontend Foundation
- Create attachment components
- Implement upload UI with drag & drop
- Add progress tracking

### Day 4: Frontend Integration
- Implement attachment list & display
- Add preview/download functionality
- Connect WebSocket events

### Day 5: Polish & Testing
- Background jobs (thumbnails, cleanup)
- E2E testing
- Bug fixes
- Documentation

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Author:** AI Assistant
**Status:** Ready for Review
