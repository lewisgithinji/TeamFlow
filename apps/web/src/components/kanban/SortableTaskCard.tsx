/**
 * Sortable Task Card Component
 * Draggable wrapper for TaskCard
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Task } from '@/stores/task.store';
import TaskCard from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onClick?: (task: Task) => void;
}

export default function SortableTaskCard({ task, onDelete, onEdit, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onDelete={onDelete}
        onEdit={onEdit}
        onClick={onClick}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}
