import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api'; // Assuming you have a pre-configured API client
import { Task } from '@teamflow/db'; // Assuming you have shared types from your DB package

// The data shape for the variables passed to the mutation
interface MoveTaskVariables {
  taskId: string;
  projectId: string;
  newStatus: string;
  newPosition: number;
}

// The expected data structure for the tasks query in the cache
type TasksData = {
  [status: string]: Task[];
};

export function useMoveTask() {
  const queryClient = useQueryClient();

  // A helper to get the query key for a project's tasks
  const tasksQueryKey = (projectId: string) => ['tasks', projectId];

  return useMutation({
    mutationFn: async ({ taskId, newStatus, newPosition }: MoveTaskVariables) => {
      // This function makes the actual API call to the specific endpoint we created.
      const { data } = await apiClient.patch(`/tasks/${taskId}/position`, {
        status: newStatus,
        position: newPosition,
      });
      return data;
    },

    // This is where the optimistic update magic happens!
    onMutate: async ({ taskId, projectId, newStatus, newPosition }) => {
      const queryKey = tasksQueryKey(projectId);

      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update.
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot the previous state of the tasks from the cache.
      const previousTasks = queryClient.getQueryData<TasksData>(queryKey);

      // 3. Optimistically update the cache to the new state.
      queryClient.setQueryData<TasksData>(queryKey, (oldData) => {
        if (!oldData) return;

        const newData = { ...oldData };
        let taskToMove: Task | undefined;

        // Find and remove the task from its old column in the cached data
        for (const status in newData) {
          const taskIndex = newData[status].findIndex((t) => t.id === taskId);
          if (taskIndex !== -1) {
            [taskToMove] = newData[status].splice(taskIndex, 1);
            break;
          }
        }

        if (!taskToMove) return oldData; // Task not found, abort the optimistic update

        // Update the task's status and add it to the new column at the correct position
        taskToMove.status = newStatus as any; // Cast because enum might not match string
        if (!newData[newStatus]) {
          newData[newStatus] = [];
        }
        newData[newStatus].splice(newPosition, 0, taskToMove);

        return newData;
      });

      // 4. Return a context object with the snapshotted value for rollback on error.
      return { previousTasks, queryKey };
    },

    // If the mutation fails, use the context returned from onMutate to roll back.
    onError: (err, variables, context) => {
      console.error('Failed to move task:', err);
      if (context?.previousTasks) {
        queryClient.setQueryData(context.queryKey, context.previousTasks);
      }
    },

    // Always refetch after the mutation is settled to ensure consistency.
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}
