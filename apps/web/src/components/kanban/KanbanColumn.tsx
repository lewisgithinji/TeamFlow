/**
 * Kanban Column Component
 * Droppable column for tasks
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { type Task } from '@/stores/task.store';
import SortableTaskCard from './SortableTaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color: 'gray' | 'blue' | 'green';
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
}

const colorClasses = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
};

export default function KanbanColumn({
  id,
  title,
  count,
  color,
  tasks,
  onDeleteTask,
  onEditTask,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow-sm p-4 transition-colors ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">{title} ({count})</h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[color]}`}
        >
          {count}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onDelete={onDeleteTask} onEdit={onEditTask} onClick={onTaskClick} />
          ))}
          {tasks.length === 0 && !isOver && (
            <p className="text-sm text-gray-500 text-center py-8">No tasks</p>
          )}
          {isOver && tasks.length === 0 && (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600">Drop task here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
