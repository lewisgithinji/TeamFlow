'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CommentForm } from './CommentForm';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  taskId: string;
  currentUserId: string;
  onUpdate: () => void;
  onDelete: () => void;
  onReply: () => void;
  level?: number;
}

export function CommentItem({
  comment,
  taskId,
  currentUserId,
  onUpdate,
  onDelete,
  onReply,
  level = 0,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = comment.user?.id === currentUserId;
  const isDeleted = comment.content === '[deleted]';

  const handleEdit = async (content: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUserId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      onDelete();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySubmit = () => {
    setIsReplying(false);
    onReply();
  };

  if (isDeleted) {
    return (
      <div className={`${level > 0 ? 'ml-12' : ''}`}>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500 italic">[This comment has been deleted]</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${level > 0 ? 'ml-12' : ''}`}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {comment.user?.name.charAt(0).toUpperCase() || '?'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">
                  {comment.user?.name || 'Unknown User'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>

              {isOwner && !isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <CommentForm
                taskId={taskId}
                currentUserId={currentUserId}
                initialContent={comment.content}
                onCommentAdded={handleEdit}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save"
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {/* Actions */}
          {!isEditing && level < 3 && (
            <div className="mt-2 flex items-center space-x-4">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Reply
              </button>
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                taskId={taskId}
                currentUserId={currentUserId}
                parentId={comment.id}
                onCommentAdded={handleReplySubmit}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  taskId={taskId}
                  currentUserId={currentUserId}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onReply={onReply}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
