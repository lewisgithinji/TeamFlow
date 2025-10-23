import { renderHook, act, waitFor } from '@testing-library/react';
import { usePresence } from './hooks';
import { useWebSocket } from './WebSocketContext';
import { UserPresence } from './types';

// Mock the useWebSocket hook that usePresence depends on.
jest.mock('./WebSocketContext', () => ({
  useWebSocket: jest.fn(),
}));

// Cast the mock to the correct type for TypeScript
const useWebSocketMock = useWebSocket as jest.Mock;

describe('usePresence Hook', () => {
  // Create a mock socket object that we can control in our tests.
  // We'll use this to simulate events from the server.
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
  };

  // Create mock functions for the context emitters
  const mockSetViewingTask = jest.fn();
  const mockLeaveRoom = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Provide a default mock implementation for the useWebSocket hook
    useWebSocketMock.mockReturnValue({
      socket: mockSocket,
      isConnected: true,
      setViewingTask: mockSetViewingTask,
      leaveRoom: mockLeaveRoom,
    });
  });

  it('should call setViewingTask when the hook mounts with a taskId', () => {
    const taskId = 'task-123';
    renderHook(() => usePresence(taskId));

    // Verify that the hook told the server we are viewing the task
    expect(mockSetViewingTask).toHaveBeenCalledWith(taskId);
    expect(mockSetViewingTask).toHaveBeenCalledTimes(1);
  });

  it('should not call setViewingTask if taskId is null', () => {
    renderHook(() => usePresence(null));

    expect(mockSetViewingTask).not.toHaveBeenCalled();
  });

  it('should update viewingUsers when a "presence:users_viewing" event is received', async () => {
    const taskId = 'task-123';
    const { result } = renderHook(() => usePresence(taskId));

    // Initially, the list of viewing users should be empty
    expect(result.current).toEqual([]);

    // Find the event handler that was registered with socket.on
    const eventHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'presence:users_viewing'
    )[1];

    const mockUsers: UserPresence[] = [
      { userId: 'user-a', name: 'Alice', avatar: 'url-a' },
      { userId: 'user-b', name: 'Bob', avatar: 'url-b' },
    ];

    // Act: Simulate the server sending the event
    act(() => {
      eventHandler({ taskId, users: mockUsers });
    });

    // Assert: The hook's return value should now be the list of users
    await waitFor(() => {
      expect(result.current).toEqual(mockUsers);
    });
  });

  it('should ignore "presence:users_viewing" events for other tasks', () => {
    const currentTaskId = 'task-123';
    const otherTaskId = 'task-456';
    const { result } = renderHook(() => usePresence(currentTaskId));

    expect(result.current).toEqual([]);

    const eventHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'presence:users_viewing'
    )[1];

    const mockUsers: UserPresence[] = [{ userId: 'user-c', name: 'Charlie', avatar: 'url-c' }];

    // Act: Simulate an event for a different task
    act(() => {
      eventHandler({ taskId: otherTaskId, users: mockUsers });
    });

    // Assert: The state should not have changed
    expect(result.current).toEqual([]);
  });

  it('should clean up the event listener on unmount', () => {
    const taskId = 'task-123';
    const { unmount } = renderHook(() => usePresence(taskId));

    // Verify the 'on' method was called
    expect(mockSocket.on).toHaveBeenCalledWith('presence:users_viewing', expect.any(Function));

    // Act: Unmount the component
    unmount();

    // Assert: The 'off' method should have been called to clean up the listener
    expect(mockSocket.off).toHaveBeenCalledWith('presence:users_viewing', expect.any(Function));
  });
});
