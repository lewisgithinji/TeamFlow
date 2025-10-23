import { handlePresenceViewing, broadcastViewingUsers } from './socket.handlers';
import { redis } from '../../redis';
import type { TypedSocket } from './socket.types';
import winston from 'winston';

// Mock dependencies
jest.mock('../../redis', () => ({
  redis: {
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(), // Mocked for broadcastViewingUsers if not mocking it directly
  },
}));

// Mock the broadcastViewingUsers function to isolate the test to handlePresenceViewing
jest.mock('./socket.handlers', () => {
  // This allows us to mock one function while keeping the original implementation for others
  const originalModule = jest.requireActual('./socket.handlers');
  return {
    ...originalModule,
    broadcastViewingUsers: jest.fn(),
  };
});

const mockedRedisSadd = redis.sadd as jest.Mock;
const mockedRedisSrem = redis.srem as jest.Mock;
const mockedBroadcastViewingUsers = broadcastViewingUsers as jest.Mock;

// A helper to create a mock socket object with the necessary properties
const createMockSocket = (data: Partial<TypedSocket['data']> = {}): Partial<TypedSocket> => ({
  data: {
    userId: 'user-123',
    email: 'test@test.com',
    ...data,
  },
  // Mock the logger to prevent errors during testing
  app: {
    logger: winston.createLogger({ silent: true }),
  },
});

describe('Socket Handlers - handlePresenceViewing', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
  });

  it('should add user to presence set when starting to view a new task', async () => {
    // Arrange: A user is not currently viewing any task
    const socket = createMockSocket() as TypedSocket;
    const newTaskId = 'task-abc';

    // Act: The user starts viewing a new task
    await handlePresenceViewing(socket, { taskId: newTaskId });

    // Assert
    // 1. It should add the user to the new task's presence set in Redis.
    expect(mockedRedisSadd).toHaveBeenCalledWith(`presence:task:${newTaskId}`, 'user-123');

    // 2. It should update the socket data to track the new task.
    expect(socket.data.viewingTaskId).toBe(newTaskId);

    // 3. It should broadcast the updated list of viewers to the new task's room.
    expect(mockedBroadcastViewingUsers).toHaveBeenCalledWith(newTaskId, socket);

    // 4. It should not try to remove from any old set.
    expect(mockedRedisSrem).not.toHaveBeenCalled();
  });

  it('should remove user from presence set when stopping viewing a task', async () => {
    // Arrange: A user is currently viewing 'task-abc'
    const oldTaskId = 'task-abc';
    const socket = createMockSocket({ viewingTaskId: oldTaskId }) as TypedSocket;

    // Act: The user stops viewing (e.g., closes the modal), so taskId is null
    await handlePresenceViewing(socket, { taskId: null });

    // Assert
    // 1. It should remove the user from the old task's presence set.
    expect(mockedRedisSrem).toHaveBeenCalledWith(`presence:task:${oldTaskId}`, 'user-123');

    // 2. It should clear the viewingTaskId from the socket data.
    expect(socket.data.viewingTaskId).toBeUndefined();

    // 3. It should broadcast the updated (likely smaller) list of viewers to the old task's room.
    expect(mockedBroadcastViewingUsers).toHaveBeenCalledWith(oldTaskId, socket);

    // 4. It should not try to add to any new set.
    expect(mockedRedisSadd).not.toHaveBeenCalled();
  });

  it('should switch presence from an old task to a new task', async () => {
    // Arrange: A user is currently viewing 'task-abc'
    const oldTaskId = 'task-abc';
    const newTaskId = 'task-xyz';
    const socket = createMockSocket({ viewingTaskId: oldTaskId }) as TypedSocket;

    // Act: The user navigates directly to view 'task-xyz'
    await handlePresenceViewing(socket, { taskId: newTaskId });

    // Assert
    // 1. It should remove the user from the OLD task's presence set.
    expect(mockedRedisSrem).toHaveBeenCalledWith(`presence:task:${oldTaskId}`, 'user-123');

    // 2. It should broadcast the update to the OLD task's room.
    expect(mockedBroadcastViewingUsers).toHaveBeenCalledWith(oldTaskId, socket);

    // 3. It should add the user to the NEW task's presence set.
    expect(mockedRedisSadd).toHaveBeenCalledWith(`presence:task:${newTaskId}`, 'user-123');

    // 4. It should update the socket data to track the NEW task.
    expect(socket.data.viewingTaskId).toBe(newTaskId);

    // 5. It should broadcast the update to the NEW task's room.
    expect(mockedBroadcastViewingUsers).toHaveBeenCalledWith(newTaskId, socket);

    // 6. Ensure functions were called in the correct order and number of times.
    expect(mockedRedisSrem).toHaveBeenCalledTimes(1);
    expect(mockedRedisSadd).toHaveBeenCalledTimes(1);
    expect(mockedBroadcastViewingUsers).toHaveBeenCalledTimes(2);
  });
});
