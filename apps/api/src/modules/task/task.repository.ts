import { prisma } from '@teamflow/database';
import { redis } from '../../redis';
import { NotFoundError } from '../../utils/errors';

const taskWithDetails = {
  include: {
    assignees: {
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    },
    project: {
      select: {
        workspaceId: true,
      },
    },
  },
};

export async function getTaskById(taskId: string) {
  const cacheKey = `task:${taskId}`;

  // 1. Check cache first
  const cachedTask = await redis.get(cacheKey);
  if (cachedTask) {
    return JSON.parse(cachedTask);
  }

  // 2. If not in cache, query the database
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    ...taskWithDetails,
  });

  if (!task) {
    throw new NotFoundError('Task');
  }

  // 3. Store the result in the cache with a 5-minute TTL
  await redis.set(cacheKey, JSON.stringify(task), 'EX', 300);

  return task;
}
