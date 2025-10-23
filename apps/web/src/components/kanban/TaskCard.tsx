/**
 * Task Card Component
 * Displays task information
 */

'use client';

import { type Task } from '@/stores/task.store';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onClick?: (task: Task) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function TaskCard({ task, onDelete, onEdit, onClick, isDragging = false, dragHandleProps }: TaskCardProps) {
  // Determine card styling based on status
  let statusClasses = 'border-gray-200 bg-white';
  if (task.status === 'IN_PROGRESS') {
    statusClasses = 'border-blue-300 bg-blue-50';
  } else if (task.status === 'DONE') {
    statusClasses = 'border-green-300 bg-green-50';
  } else if (task.status === 'BLOCKED') {
    statusClasses = 'border-red-300 bg-red-50';
  } else if (task.status === 'CANCELLED') {
    statusClasses = 'border-gray-300 bg-gray-100';
  }

  return (
    <div
      onClick={() => onClick?.(task)}
      className={`rounded-lg border p-4 transition-all ${statusClasses} ${
        isDragging ? 'shadow-2xl cursor-grabbing' : onClick ? 'hover:shadow-md cursor-pointer' : 'hover:shadow-md cursor-grab'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0"
              title="Drag to move"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          )}
          <h3 className="font-medium text-gray-900 flex-1 pr-2">{task.title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="text-gray-400 hover:text-blue-600"
              title="Edit task"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-gray-400 hover:text-red-600"
            title="Delete task"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>

        {task.storyPoints && (
          <span className="text-xs text-gray-500">{task.storyPoints} pts</span>
        )}
      </div>

      {task.assignees && task.assignees.length > 0 && (
        <div className="mt-3 flex -space-x-2">
          {task.assignees.map((assignee, idx) => (
            <div
              key={idx}
              className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs text-white font-medium ring-2 ring-white"
              title={assignee.user.name}
            >
              {assignee.user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: label.label.color + '20',
                color: label.label.color,
              }}
            >
              {label.label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
