import { Request, Response } from 'express';
import * as activityService from '@teamflow/activity';
import { EntityType } from '@teamflow/database';

/**
 * Get activities with filters
 */
export async function getActivities(req: Request, res: Response) {
  try {
    const filters: any = {
      workspaceId: req.query.workspaceId as string,
      userId: req.query.userId as string,
      entityId: req.query.entityId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    // Validate and convert entityType to enum
    if (req.query.entityType) {
      const entityType = (req.query.entityType as string).toUpperCase();
      if (Object.values(EntityType).includes(entityType as EntityType)) {
        filters.entityType = entityType as EntityType;
      }
    }

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const result = await activityService.getActivities(filters);

    res.json({
      success: true,
      data: result.activities,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get activities',
    });
  }
}

/**
 * Get activity by ID
 */
export async function getActivityById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const activity = await activityService.getActivityById(id);

    if (!activity) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Activity not found',
      });
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Get activity by ID error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get activity',
    });
  }
}

/**
 * Create activity
 */
export async function createActivity(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;

    const input = {
      ...req.body,
      userId,
    };

    const activity = await activityService.createActivity(input);

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to create activity',
    });
  }
}

/**
 * Delete activity
 */
export async function deleteActivity(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await activityService.deleteActivity(id);

    res.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to delete activity',
    });
  }
}
