import { z } from 'zod';
import { AttachmentStatus } from '@teamflow/database';

/**
 * Attachment metadata structure
 */
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

/**
 * Input for creating an attachment
 */
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

/**
 * Attachment response structure
 */
export interface AttachmentResponse {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  url: string; // Signed URL (time-limited)
  mimeType: string;
  size: number;
  status: AttachmentStatus;
  thumbnailUrl?: string;
  metadata?: AttachmentMetadata;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Upload URL response
 */
export interface UploadUrlResponse {
  uploadUrl: string; // Presigned upload URL
  storageKey: string; // Key to use for finalizing
  expiresIn: number; // Seconds until expiry
  maxSize: number; // Max file size allowed
}

/**
 * Attachment list response
 */
export interface AttachmentListResponse {
  attachments: AttachmentResponse[];
  totalSize: number; // Total bytes used by task
  count: number;
}

/**
 * Download URL response
 */
export interface DownloadUrlResponse {
  downloadUrl: string;
  filename: string;
  expiresIn: number;
}

// ============================================
// Zod Validation Schemas
// ============================================

/**
 * Request upload URL schema
 */
export const requestUploadUrlSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters'),
  mimeType: z
    .string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/, 'Invalid MIME type'),
  size: z
    .number()
    .int('Size must be an integer')
    .positive('Size must be positive')
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;

/**
 * Finalize upload schema
 */
export const finalizeUploadSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters'),
  originalName: z
    .string()
    .min(1, 'Original name is required')
    .max(255, 'Original name must be less than 255 characters'),
  storageKey: z.string().min(1, 'Storage key is required'),
  mimeType: z.string(),
  size: z.number().int().positive(),
  checksum: z.string().optional(),
  metadata: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
      format: z.string().optional(),
      duration: z.number().optional(),
    })
    .optional(),
});

export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>;
