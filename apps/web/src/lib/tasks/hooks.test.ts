import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMoveTask } from './hooks';
import { apiClient } from '@/lib/api';
import { Task } from '@teamflow/db';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    patch: jest.fn(),
  },
}));

const mockedApiClientPatch = apiClient.patch as jest.Mock;

// A helper to create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

const wrapper = ({
  children,
  client,
}: {
  children: React.ReactNode;
  client: QueryClient;
}) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

describe('useMoveTask Hook', () => {
  const projectId = 'project-1';
  const tasksQueryKey = ['tasks', projectId];

  const initialTasks = {
    TODO: [
      { id: 'task-1', title: 'Task 1', status: 'TODO', position: 0 },
      { id: 'task-2', title: 'Task 2', status: 'TODO', position: 1 },
    ],
    IN_PROGRESS: [{ id: 'task-3', title: 'Task 3', status: 'IN_PROGRESS', position: 0 }],
  };

  beforeEach(() => {
    mockedApiClientPatch.mockClear();
  });

  it('should optimistically update the cache on a successful mutation', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(tasksQueryKey, initialTasks);

    // Mock a successful API response
    mockedApiClientPatch.mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useMoveTask(), {
      wrapper: ({ children }) => wrapper({ children, client: queryClient }),
    });

    // Act: Move 'task-2' from 'TODO' to 'IN_PROGRESS' at position 0
    result.current.mutate({
      taskId: 'task-2',
      projectId,
      newStatus: 'IN_PROGRESS',
      newPosition: 0,
    });

    // Assert: Check the cache immediately after mutation is called
    // The UI should have updated instantly.
    const updatedCacheState = queryClient.getQueryData(tasksQueryKey);
    expect(updatedCacheState).toEqual({
      TODO: [{ id: 'task-1', title: 'Task 1', status: 'TODO', position: 0 }],
      IN_PROGRESS: [
        { id: 'task-2', title: 'Task 2', status: 'IN_PROGRESS', position: 1 }, // Note: position is not updated optimistically, just status and array
        { id: 'task-3', title: 'Task 3', status: 'IN_PROGRESS', position: 0 },
      ],
    });

    // Wait for the mutation to settle
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the API was called correctly
    expect(mockedApiClientPatch).toHaveBeenCalledWith('/tasks/task-2/position', {
      status: 'IN_PROGRESS',
      position: 0,
    });
  });

  it('should roll back the optimistic update on a failed mutation', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(tasksQueryKey, initialTasks);

    // Mock a failed API response
    const error = new Error('Server error: Could not move task');
    mockedApiClientPatch.mockRejectedValue(error);

    const { result } = renderHook(() => useMoveTask(), {
      wrapper: ({ children }) => wrapper({ children, client: queryClient }),
    });

    // Act: Try to move 'task-1'
    result.current.mutate({
      taskId: 'task-1',
      projectId,
      newStatus: 'IN_PROGRESS',
      newPosition: 0,
    });

    // Assert: Check the optimistic update happened first
    const optimisticState = queryClient.getQueryData(tasksQueryKey);
    expect(optimisticState).toEqual({
      TODO: [{ id: 'task-2', title: 'Task 2', status: 'TODO', position: 1 }],
      IN_PROGRESS: [
        { id: 'task-1', title: 'Task 1', status: 'IN_PROGRESS', position: 0 },
        { id: 'task-3', title: 'Task 3', status: 'IN_PROGRESS', position: 0 },
      ],
    });

    // Wait for the mutation to fail and settle
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert: The cache should be rolled back to its original state
    const finalCacheState = queryClient.getQueryData(tasksQueryKey);
    expect(finalCacheState).toEqual(initialTasks);
  });
});