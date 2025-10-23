import { prisma } from '@teamflow/database';
import { redis } from '../../redis';
import { createTask, updateTask, updateTaskPosition, deleteTask } from './task.service';
import { NotFoundError } from '../../utils/errors';
import * as taskRepository from './task.repository';
import { emitTaskUpdated, emitTaskDeleted, emitTaskCreated } from '../../websocket';
import { createNotification } from '../notification/notification.service';

// Mock dependencies
jest.mock('@teamflow/database', () => ({
  prisma: {
    task: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    taskAssignee: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('./task.repository', () => ({
  getTaskById: jest.fn(),
}));

jest.mock('../../websocket', () => ({
  emitTaskUpdated: jest.fn(),
  emitTaskCreated: jest.fn(),
  emitTaskDeleted: jest.fn(),
}));

jest.mock('../notification/notification.service', () => ({
  createNotification: jest.fn(),
}));

// Cast mocks to Jest's mock function type for type safety
const mockedPrismaTaskFindUnique = prisma.task.findUnique as jest.Mock;
const mockedPrismaTaskCreate = prisma.task.create as jest.Mock;
const mockedPrismaTaskUpdate = prisma.task.update as jest.Mock;
const mockedPrismaTaskAggregate = prisma.task.aggregate as jest.Mock;
const mockedGetTaskById = taskRepository.getTaskById as jest.Mock;
const mockedRedisGet = redis.get as jest.Mock;
const mockedRedisSet = redis.set as jest.Mock;
const mockedRedisDel = redis.del as jest.Mock;
const mockedEmitTaskUpdated = emitTaskUpdated as jest.Mock;
const mockedCreateNotification = createNotification as jest.Mock;

describe('Task Service - updateTaskPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to get the mock transaction client from the transaction call
  const getMockTx = async () => {
    const transactionCallback = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    return { task: { updateMany: jest.fn(), update: jest.fn() } };
  });

  const mockUser = { id: 'user-1', name: 'Test User', email: 'test@test.com' };
  const taskId = 'task-to-move';

  it('should correctly reorder tasks when moving within the same column', async () => {
    // Arrange: Task is at position 1 in 'TODO'
    const mockTaskToMove = {
      id: taskId,
      projectId: 'project-1',
      status: 'TODO',
      position: 1,
      project: { workspaceId: 'ws-1' },
    };
    mockedGetTaskById.mockResolvedValue(mockTaskToMove);

    // Act: Move the task to position 3 in the same 'TODO' column
    const input = { status: 'TODO', position: 3 };
    await updateTaskPosition(taskId, input, mockUser as any);

    // Assert transaction was called
    expect(prisma.$transaction).toHaveBeenCalled();

    // Execute the transaction callback with a mock client to inspect its calls
    const transactionCallback = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    const mockTx = { task: { updateMany: jest.fn(), update: jest.fn() } };
    await transactionCallback(mockTx);

    // 1. It should decrement positions of tasks that were after the old position
    expect(mockTx.task.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'TODO', position: { gt: 1 } },
      data: { position: { decrement: 1 } },
    });

    // 2. It should increment positions of tasks at and after the new position
    expect(mockTx.task.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'TODO', position: { gte: 3 } },
      data: { position: { increment: 1 } },
    });

    // 3. It should update the moved task itself
    expect(mockTx.task.update).toHaveBeenCalledWith({
      where: { id: taskId },
      data: { status: 'TODO', position: 3, version: { increment: 1 } },
    });

    // 4. It should invalidate the cache and emit an event
    expect(mockedRedisDel).toHaveBeenCalledWith(`task:${taskId}`);
    expect(mockedEmitTaskUpdated).toHaveBeenCalled();
  });

  it('should correctly reorder tasks when moving to a different column', async () => {
    // Arrange: Task is at position 1 in 'TODO'
    const mockTaskToMove = {
      id: taskId,
      projectId: 'project-1',
      status: 'TODO',
      position: 1,
      project: { workspaceId: 'ws-1' },
    };
    mockedGetTaskById.mockResolvedValue(mockTaskToMove);

    // Act: Move the task to position 0 in 'IN_PROGRESS'
    const input = { status: 'IN_PROGRESS', position: 0 };
    await updateTaskPosition(taskId, input, mockUser as any);

    // Assert
    expect(prisma.$transaction).toHaveBeenCalled();

    const transactionCallback = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    const mockTx = { task: { updateMany: jest.fn(), update: jest.fn() } };
    await transactionCallback(mockTx);

    // 1. It should decrement positions in the OLD column ('TODO')
    expect(mockTx.task.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'TODO', position: { gt: 1 } },
      data: { position: { decrement: 1 } },
    });

    // 2. It should increment positions in the NEW column ('IN_PROGRESS')
    expect(mockTx.task.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'IN_PROGRESS', position: { gte: 0 } },
      data: { position: { increment: 1 } },
    });

    // 3. It should update the moved task itself
    expect(mockTx.task.update).toHaveBeenCalledWith({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS', position: 0, version: { increment: 1 } },
    });
  });

  it('should throw NotFoundError if task to move does not exist', async () => {
    mockedGetTaskById.mockResolvedValue(null);
    await expect(
      updateTaskPosition(taskId, { status: 'TODO', position: 0 }, mockUser as any)
    ).rejects.toThrow(NotFoundError);
  });
});

describe('Task Service - createTask with Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrismaTaskAggregate.mockResolvedValue({ _max: { position: 0 } });
  });

  const mockUser = { id: 'user-creator', name: 'Creator User' };
  const createTaskInput = {
    projectId: 'project-1',
    title: 'New Awesome Task',
    assigneeIds: ['user-assignee-1', 'user-assignee-2'],
  };
  const createdTask = {
    id: 'task-new',
    title: 'New Awesome Task',
    projectId: 'project-1',
    project: { workspaceId: 'ws-1' },
  };

  it('should send notifications to all assignees on creation', async () => {
    mockedPrismaTaskCreate.mockResolvedValue(createdTask);

    await createTask(createTaskInput, mockUser as any);

    expect(mockedCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockedCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-assignee-1' })
    );
    expect(mockedCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-assignee-2' })
    );
  });

  it('should not send a notification to the user who assigns a task to themselves', async () => {
    mockedPrismaTaskCreate.mockResolvedValue(createdTask);
    const inputWithSelfAssign = {
      ...createTaskInput,
      assigneeIds: ['user-assignee-1', 'user-creator'],
    };

    await createTask(inputWithSelfAssign, mockUser as any);

    // Should only be called for 'user-assignee-1'
    expect(mockedCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockedCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-assignee-1' })
    );
    expect(mockedCreateNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-creator' })
    );
  });
});

describe('Task Service - updateTask with Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = { id: 'user-updater', name: 'Updater User' };
  const taskId = 'task-to-update';
  const updatedTask = {
    id: taskId,
    title: 'Updated Task Title',
    projectId: 'project-1',
    project: { workspaceId: 'ws-1' },
  };

  it('should only send notifications to newly added assignees', async () => {
    // Arrange: Task currently assigned to 'user-old'
    const currentTask = { assignees: [{ user: { id: 'user-old' } }] };
    mockedPrismaTaskFindUnique.mockResolvedValue(currentTask);
    mockedPrismaTaskUpdate.mockResolvedValue(updatedTask);

    // Act: Update assignees to be 'user-old' and 'user-new'
    const updateInput = { assigneeIds: ['user-old', 'user-new'] };
    await updateTask(taskId, updateInput, mockUser as any);

    // Assert: Notification should only be sent to 'user-new'
    expect(mockedCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockedCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-new' })
    );
    expect(mockedCreateNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-old' })
    );
  });

  it('should not send any notifications if no new users are assigned', async () => {
    // Arrange: Task assigned to 'user-old'
    const currentTask = { assignees: [{ user: { id: 'user-old' } }] };
    mockedPrismaTaskFindUnique.mockResolvedValue(currentTask);
    mockedPrismaTaskUpdate.mockResolvedValue(updatedTask);

    // Act: Update only the title, keeping the same assignee
    const updateInput = { title: 'New Title', assigneeIds: ['user-old'] };
    await updateTask(taskId, updateInput, mockUser as any);

    // Assert: No notifications should be sent
    expect(mockedCreateNotification).not.toHaveBeenCalled();
  });

  it('should correctly calculate assignees to add and remove', async () => {
    // Arrange: Task assigned to 'user-old-1' and 'user-common'
    const currentTask = {
      assignees: [{ user: { id: 'user-old-1' } }, { user: { id: 'user-common' } }],
    };
    mockedPrismaTaskFindUnique.mockResolvedValue(currentTask);
    mockedPrismaTaskUpdate.mockResolvedValue(updatedTask);

    // Act: Update assignees to 'user-common' and 'user-new-1'
    // This means 'user-old-1' is removed and 'user-new-1' is added.
    const updateInput = { assigneeIds: ['user-common', 'user-new-1'] };
    await updateTask(taskId, updateInput, mockUser as any);

    // Assert: Check the data passed to prisma.task.update
    expect(mockedPrismaTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignees: {
            create: [{ userId: 'user-new-1' }],
            deleteMany: { userId: { in: ['user-old-1'] } },
          },
        }),
      })
    );

    // Assert: Notification sent only to the new assignee
    expect(mockedCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockedCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-new-1' })
    );
  });

  it('should handle removing all assignees', async () => {
    // Arrange: Task assigned to 'user-1' and 'user-2'
    const currentTask = {
      assignees: [{ user: { id: 'user-1' } }, { user: { id: 'user-2' } }],
    };
    mockedPrismaTaskFindUnique.mockResolvedValue(currentTask);
    mockedPrismaTaskUpdate.mockResolvedValue(updatedTask);

    // Act: Update with an empty assigneeIds array
    const updateInput = { assigneeIds: [] };
    await updateTask(taskId, updateInput, mockUser as any);

    // Assert: It should delete all existing assignees
    expect(mockedPrismaTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignees: {
            create: [],
            deleteMany: { userId: { in: ['user-1', 'user-2'] } },
          },
        }),
      })
    );

    // Assert: No notifications should be sent
    expect(mockedCreateNotification).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError if the task does not exist', async () => {
    // Arrange: getTaskById will throw an error
    mockedPrismaTaskFindUnique.mockResolvedValue(null); // Simulate task not found in DB or cache

    // Act & Assert
    await expect(updateTask(taskId, {}, mockUser as any)).rejects.toThrow(NotFoundError);
  });
});

describe('Task Service - getTaskById with Caching', () => {
  const taskId = 'task-cached';
  const mockTask = { id: taskId, title: 'Cached Task' };
  const cacheKey = `task:${taskId}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the task from cache if it exists', async () => {
    // Arrange: Redis has the cached task
    mockedRedisGet.mockResolvedValue(JSON.stringify(mockTask));

    // Act
    const result = await getTaskById(taskId);

    // Assert
    expect(result).toEqual(mockTask);
    expect(mockedRedisGet).toHaveBeenCalledWith(cacheKey);
    expect(mockedPrismaTaskFindUnique).not.toHaveBeenCalled();
    expect(mockedRedisSet).not.toHaveBeenCalled();
  });

  it('should fetch from the database and cache the result if not in cache', async () => {
    // Arrange: Redis cache is empty, but the database has the task
    mockedRedisGet.mockResolvedValue(null);
    mockedPrismaTaskFindUnique.mockResolvedValue(mockTask);

    // Act
    const result = await getTaskById(taskId);

    // Assert
    expect(result).toEqual(mockTask);
    expect(mockedRedisGet).toHaveBeenCalledWith(cacheKey);
    expect(mockedPrismaTaskFindUnique).toHaveBeenCalledWith({
      where: { id: taskId },
      ...expect.any(Object), // taskWithDetails
    });
    expect(mockedRedisSet).toHaveBeenCalledWith(cacheKey, JSON.stringify(mockTask), 'EX', 300);
  });

  it('should throw NotFoundError if the task is not in cache or database', async () => {
    // Arrange: Both Redis and the database are empty
    mockedRedisGet.mockResolvedValue(null);
    mockedPrismaTaskFindUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(getTaskById(taskId)).rejects.toThrow(NotFoundError);
  });
});
