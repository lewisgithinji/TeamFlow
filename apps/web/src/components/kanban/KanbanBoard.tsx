/**
 * Kanban Board with Drag and Drop
 * Reference: Sprint 1 Planning - User Story 3.2
 * Implements drag-and-drop task management
 */

'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTaskStore, type Task } from '@/stores/task.store';
import { useTaskEvents, useAutoJoinRooms } from '@/lib/websocket';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import EditTaskModal from '../task/EditTaskModal';

interface KanbanBoardProps {
  tasks: Task[];
  projectId?: string;
  workspaceId?: string;
  onCreateTask: () => void;
  onTaskClick?: (task: Task) => void;
}

export default function KanbanBoard({
  tasks,
  projectId,
  workspaceId,
  onCreateTask,
  onTaskClick,
}: KanbanBoardProps) {
  const { updateTaskPosition, updateTask, addTask, deleteTask: removeTask } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  // Auto-join project room for real-time updates
  useAutoJoinRooms({ projectId, workspaceId });

  // Listen to real-time task events
  useTaskEvents({
    onTaskCreated: (data) => {
      // Only update if it's for this project
      if (projectId && data.projectId === projectId) {
        console.log('📋 Real-time: Task created', data.task);
        if (data.task) {
          addTask(data.task);
          showNotification(`New task: ${data.task.title}`, data.updatedBy.avatar);
        }
      }
    },
    onTaskUpdated: (data) => {
      if (projectId && data.projectId === projectId) {
        console.log('📝 Real-time: Task updated', data.taskId, data.updates);
        if (data.updates) {
          // Always update the task in the store, regardless of who made the change
          updateTask(data.taskId, data.updates);

          // Only show notification if someone else made the change
          if (data.updatedBy.userId !== getCurrentUserId()) {
            // Check if this is a move event by looking for oldStatus
            if (data.updates.oldStatus && data.updates.newStatus) {
              showNotification(
                `${data.updatedBy.name} moved "${data.updates.title}" from ${data.updates.oldStatus} to ${data.updates.newStatus}`,
                data.updatedBy.avatar
              );
            } else {
              showNotification(
                `${data.updatedBy.name} updated "${data.updates.title}"`,
                data.updatedBy.avatar
              );
            }
          } else {
            console.log('✅ Task updated by current user, UI should refresh automatically');
          }
        }
      }
    },
    onTaskDeleted: (data) => {
      if (projectId && data.projectId === projectId) {
        console.log('🗑️ Real-time: Task deleted', data.taskId);
        removeTask(data.taskId);
        showNotification(`Task deleted by ${data.updatedBy.name}`, data.updatedBy.avatar);
      }
    },
    onTaskMoved: (data) => {
      if (projectId && data.projectId === projectId) {
        console.log('🔄 Real-time: Task moved', data.taskId);
        if (data.updates) {
          updateTask(data.taskId, data.updates);
          if (data.updatedBy.userId !== getCurrentUserId()) {
            showNotification(`${data.updatedBy.name} moved a task`, data.updatedBy.avatar);
          }
        }
      }
    },
  });

  // Helper function to show real-time notifications
  const showNotification = (message: string, avatar?: string | null) => {
    setRealtimeNotification({ message, avatar });
  };

  // Helper to get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || '';
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return '';
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  const groupedTasks = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine the new status based on what was dropped over
    let newStatus: Task['status'] = task.status;

    if (overId === 'TODO' || overId === 'IN_PROGRESS' || overId === 'DONE') {
      newStatus = overId as Task['status'];
    } else {
      // Dropped over another task - find that task's status
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // If status hasn't changed and dropped in same position, do nothing
    if (newStatus === task.status && overId === taskId) {
      return;
    }

    // Calculate new position
    const tasksInNewColumn = tasks.filter((t) => t.status === newStatus);
    let newPosition = 0;

    if (overId === newStatus) {
      // Dropped at the end of the column
      newPosition = tasksInNewColumn.length;
    } else {
      // Dropped over another task
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && overTask.status === newStatus) {
        newPosition = overTask.position;
      } else {
        newPosition = tasksInNewColumn.length;
      }
    }

    // Optimistically update the UI
    updateTask(taskId, { status: newStatus, position: newPosition });

    // Update on the backend
    try {
      await updateTaskPosition(taskId, newStatus, newPosition);
    } catch (error) {
      // Revert on error
      updateTask(taskId, { status: task.status, position: task.position });
      console.error('Failed to update task position:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { deleteTask } = useTaskStore.getState();
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No tasks yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating your first task.</p>
        <div className="mt-6">
          <button
            onClick={onCreateTask}
            className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Task
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Real-time Notification Toast */}
      {realtimeNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="rounded-lg bg-blue-600 px-4 py-3 text-white shadow-lg flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              {realtimeNotification.avatar ? (
                <img
                  src={realtimeNotification.avatar}
                  alt="User avatar"
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              )}
              <p className="text-sm font-medium">{realtimeNotification.message}</p>
            </div>
            <button
              onClick={() => setRealtimeNotification(null)}
              className="p-1 rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Dismiss notification"
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
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KanbanColumn
            id="TODO"
            title="To Do"
            count={groupedTasks.TODO.length}
            color="gray"
            tasks={groupedTasks.TODO}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onTaskClick={onTaskClick}
          />

          <KanbanColumn
            id="IN_PROGRESS"
            title="In Progress"
            count={groupedTasks.IN_PROGRESS.length}
            color="blue"
            tasks={groupedTasks.IN_PROGRESS}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onTaskClick={onTaskClick}
          />

          <KanbanColumn
            id="DONE"
            title="Done"
            count={groupedTasks.DONE.length}
            color="green"
            tasks={groupedTasks.DONE}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onTaskClick={onTaskClick}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-80">
              <TaskCard task={activeTask} onDelete={() => {}} isDragging />
            </div>
          ) : null}
        </DragOverlay>

        {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
      </DndContext>
    </>
  );
}
