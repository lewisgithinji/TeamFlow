import sharp from 'sharp';
import { logger } from '../utils/logger';

/**
 * Thumbnail Service
 * Handles thumbnail generation for images
 */
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
   * @param mimeType - MIME type of the file
   * @returns True if thumbnail can be generated
   */
  canGenerateThumbnail(mimeType: string): boolean {
    return this.SUPPORTED_TYPES.includes(mimeType);
  }

  /**
   * Generate thumbnail for image
   * @param originalBuffer - Original image buffer
   * @returns Thumbnail buffer
   */
  async generateThumbnail(originalBuffer: Buffer): Promise<Buffer> {
    try {
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: this.THUMBNAIL_QUALITY })
        .toBuffer();

      logger.debug('Thumbnail generated successfully', {
        originalSize: originalBuffer.length,
        thumbnailSize: thumbnailBuffer.length,
      });

      return thumbnailBuffer;
    } catch (error) {
      logger.error('Failed to generate thumbnail', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Extract image metadata
   * @param buffer - Image buffer
   * @returns Image metadata
   */
  async extractMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
      };
    } catch (error) {
      logger.error('Failed to extract image metadata', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to extract image metadata');
    }
  }

  /**
   * Get thumbnail storage key from original storage key
   * @param storageKey - Original file storage key
   * @returns Thumbnail storage key
   */
  getThumbnailKey(storageKey: string): string {
    return storageKey
      .replace('attachments/', 'thumbnails/')
      .replace(/\.[^.]+$/, '_thumb.jpg');
  }
}

// Singleton instance
export const thumbnailService = new ThumbnailService();
