import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Storage Service for Cloudflare R2
 * Handles file uploads, downloads, and management using S3-compatible API
 */
export class StorageService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || 'teamflow-attachments';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';

    // Configure S3 client for Cloudflare R2
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    logger.info('Storage service initialized', {
      bucket: this.bucketName,
      endpoint: process.env.R2_ENDPOINT,
    });
  }

  /**
   * Generate presigned upload URL
   * @param taskId - Task ID for organizing files
   * @param filename - Original filename
   * @param mimeType - File MIME type
   * @param expiresIn - URL expiry in seconds (default: 15 minutes)
   * @returns Upload URL and storage key
   */
  async generateUploadUrl(
    taskId: string,
    filename: string,
    mimeType: string,
    expiresIn: number = 900 // 15 minutes
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    try {
      const fileExtension = filename.split('.').pop() || '';
      const uuid = crypto.randomUUID();
      const storageKey = `attachments/task-${taskId}/${uuid}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

      logger.info('Generated upload URL', {
        taskId,
        filename,
        storageKey,
        expiresIn,
      });

      return { uploadUrl, storageKey };
    } catch (error) {
      logger.error('Failed to generate upload URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
        filename,
      });
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate presigned download URL
   * @param storageKey - Storage key from database
   * @param filename - Filename for Content-Disposition header
   * @param expiresIn - URL expiry in seconds (default: 1 hour)
   * @returns Signed download URL
   */
  async generateDownloadUrl(
    storageKey: string,
    filename: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ResponseContentDisposition: `attachment; filename="${this.sanitizeFilename(filename)}"`,
      });

      const downloadUrl = await getSignedUrl(this.client, command, { expiresIn });

      logger.debug('Generated download URL', {
        storageKey,
        filename,
        expiresIn,
      });

      return downloadUrl;
    } catch (error) {
      logger.error('Failed to generate download URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        storageKey,
      });
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Generate presigned URL for inline viewing (images, PDFs)
   * @param storageKey - Storage key from database
   * @param expiresIn - URL expiry in seconds (default: 1 hour)
   * @returns Signed view URL
   */
  async generateViewUrl(
    storageKey: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ResponseContentDisposition: 'inline',
      });

      const viewUrl = await getSignedUrl(this.client, command, { expiresIn });

      logger.debug('Generated view URL', {
        storageKey,
        expiresIn,
      });

      return viewUrl;
    } catch (error) {
      logger.error('Failed to generate view URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        storageKey,
      });
      throw new Error('Failed to generate view URL');
    }
  }

  /**
   * Verify file exists in storage
   * @param storageKey - Storage key to check
   * @returns True if file exists, false otherwise
   */
  async fileExists(storageKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      logger.debug('File does not exist', { storageKey });
      return false;
    }
  }

  /**
   * Delete file from storage
   * @param storageKey - Storage key to delete
   */
  async deleteFile(storageKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      await this.client.send(command);

      logger.info('File deleted from storage', { storageKey });
    } catch (error) {
      logger.error('Failed to delete file', {
        error: error instanceof Error ? error.message : 'Unknown error',
        storageKey,
      });
      throw new Error('Failed to delete file from storage');
    }
  }

  /**
   * Get file metadata (size, content-type, etc.)
   * @param storageKey - Storage key to query
   * @returns File metadata
   */
  async getFileMetadata(storageKey: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      const response = await this.client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      logger.error('Failed to get file metadata', {
        error: error instanceof Error ? error.message : 'Unknown error',
        storageKey,
      });
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Sanitize filename to prevent directory traversal and special characters
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove directory separators and special characters
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/^\.+/, '')
      .trim();
  }
}

// Singleton instance
export const storageService = new StorageService();
