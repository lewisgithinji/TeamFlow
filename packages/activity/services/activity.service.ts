import { prisma } from '@teamflow/database';
import type {
  Activity,
  CreateActivityInput,
  ActivityFilters,
  ActivityListResult,
} from '../types/activity.types';

/**
 * Create a new activity
 */
export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const activity = await prisma.activity.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId || null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata || {},
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          projectId: true,
        },
      },
    },
  });

  return activity as Activity;
}

/**
 * Get activities with filters
 */
export async function getActivities(filters: ActivityFilters): Promise<ActivityListResult> {
  const {
    workspaceId,
    userId,
    entityType,
    entityId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  const where: any = {};

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (userId) {
    where.userId = userId;
  }

  if (entityType) {
    where.entityType = entityType;
  }

  if (entityId) {
    where.entityId = entityId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities: activities as Activity[],
    total,
    hasMore: offset + activities.length < total,
  };
}

/**
 * Get activity by ID
 */
export async function getActivityById(id: string): Promise<Activity | null> {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          projectId: true,
        },
      },
    },
  });

  return activity as Activity | null;
}

/**
 * Delete activity
 */
export async function deleteActivity(id: string): Promise<void> {
  await prisma.activity.delete({
    where: { id },
  });
}

/**
 * Delete activities by entity
 */
export async function deleteActivitiesByEntity(
  entityType: string,
  entityId: string
): Promise<void> {
  await prisma.activity.deleteMany({
    where: {
      entityType,
      entityId,
    },
  });
}
