/**
 * Attachment constraints and configuration
 */
export const ATTACHMENT_CONSTRAINTS = {
  // File size limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
  MAX_TASK_STORAGE: 50 * 1024 * 1024, // 50MB per task
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
  SIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
  UPLOAD_URL_EXPIRY: 900, // 15 minutes in seconds

  // Filename validation
  MAX_FILENAME_LENGTH: 255,
  INVALID_FILENAME_CHARS: /[<>:"/\\|?*\x00-\x1F]/g,
};

/**
 * Helper function to check if MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ATTACHMENT_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Helper function to check if MIME type supports thumbnails
 */
export function supportsThumbnails(mimeType: string): boolean {
  return ATTACHMENT_CONSTRAINTS.THUMBNAIL_MIME_TYPES.includes(mimeType);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
