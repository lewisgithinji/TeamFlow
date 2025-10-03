'use client';

import { useState, useEffect } from 'react';
import { CommentList } from '@/components/comment';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignees?: any[];
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function TaskDetailModal({ task, isOpen, onClose, currentUserId }: TaskDetailModalProps) {
  const isLoading = false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl h-[90vh] rounded-lg bg-white shadow-xl flex flex-col z-10">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {task?.title || 'Task Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : task ? (
              <div className="space-y-6">
                {/* Task Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600">
                      {task.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Status</h3>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {task.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Priority</h3>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="border-t-4 border-blue-500 pt-6 mt-6 bg-blue-50 p-4 rounded">
                  <h2 className="text-xl font-bold mb-4 text-blue-900">📝 COMMENTS SECTION</h2>
                  <CommentList
                    taskId={task.id}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Task not found
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
