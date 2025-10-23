'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Download, Trash2, Upload, FileIcon, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface AttachmentListProps {
  taskId: string;
  currentUserId: string;
}

export function AttachmentList({ taskId, currentUserId }: AttachmentListProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch attachments
  const { data: attachments, isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments', taskId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/tasks/${taskId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch attachments');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Delete attachment mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to delete attachment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      toast.success('Attachment deleted');
    },
    onError: () => {
      toast.error('Failed to delete attachment');
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const token = localStorage.getItem('token');

    try {
      for (const file of Array.from(files)) {
        // Validate file size (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} is too large. Max size is 10MB.`);
          continue;
        }

        // Step 1: Request presigned upload URL
        const uploadUrlResponse = await fetch(
          `http://localhost:4000/api/tasks/${taskId}/attachments/upload-url`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
            }),
          }
        );

        if (!uploadUrlResponse.ok) {
          const error = await uploadUrlResponse.json();
          throw new Error(error.message || 'Failed to get upload URL');
        }

        const { uploadUrl, attachmentId, storageKey } = await uploadUrlResponse.json();

        // Step 2: Upload file to cloud storage using presigned URL
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to storage');
        }

        // Step 3: Finalize attachment record in database
        const finalizeResponse = await fetch(
          `http://localhost:4000/api/tasks/${taskId}/attachments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              attachmentId,
              storageKey,
              filename: file.name,
              fileSize: file.size,
              mimeType: file.type || 'application/octet-stream',
            }),
          }
        );

        if (!finalizeResponse.ok) {
          throw new Error('Failed to finalize attachment');
        }

        toast.success(`${file.name} uploaded successfully!`);
      }

      // Refresh attachments list
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments
          {attachments && attachments.length > 0 && (
            <span className="text-sm text-gray-500">({attachments.length})</span>
          )}
        </h3>

        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </div>
        </label>
      </div>

      {/* Attachments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* File Icon or Thumbnail */}
                {attachment.thumbnailUrl ? (
                  <img
                    src={attachment.thumbnailUrl}
                    alt={attachment.fileName}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                    {getFileIcon(attachment.mimeType)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    <span>•</span>
                    <span>by {attachment.uploadedBy.name}</span>
                    <span>•</span>
                    <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={attachment.url}
                  download={attachment.fileName}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>

                {attachment.uploadedBy.id === currentUserId && (
                  <button
                    onClick={() => deleteMutation.mutate(attachment.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Paperclip className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No attachments yet</p>
          <p className="text-xs mt-1">Upload files to share with your team</p>
        </div>
      )}

      {/* Configuration note */}
      <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
        <strong>Setup Required:</strong> To enable file uploads, configure Cloudflare R2 or AWS S3 credentials in your .env file.
        See .env.example for required variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, etc.).
      </div>
    </div>
  );
}
