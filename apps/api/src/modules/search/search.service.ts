import { PrismaClient, Prisma } from '@prisma/client';
import { SearchQuery, SearchResult, TaskSearchResult, SavedFilterInput, SavedFilterResponse } from './search.types';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class SearchService {
  /**
   * Search tasks with full-text search and filters
   */
  async searchTasks(query: SearchQuery): Promise<SearchResult> {
    const {
      q,
      workspaceId,
      projectId,
      status,
      priority,
      assigneeId,
      labelId,
      dueDateFrom,
      dueDateTo,
      createdBy,
      sortBy = 'relevance',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    try {
      // Build WHERE clause
      const where: any = {};

      // Workspace filter (via project)
      if (workspaceId) {
        where.project = { workspaceId };
      }

      // Project filter
      if (projectId) {
        where.projectId = projectId;
      }

      // Status filter
      if (status && status.length > 0) {
        where.status = { in: status };
      }

      // Priority filter
      if (priority && priority.length > 0) {
        where.priority = { in: priority };
      }

      // Assignee filter
      if (assigneeId && assigneeId.length > 0) {
        where.assignees = {
          some: {
            userId: { in: assigneeId },
          },
        };
      }

      // Label filter
      if (labelId && labelId.length > 0) {
        where.labels = {
          some: {
            labelId: { in: labelId },
          },
        };
      }

      // Due date filter
      if (dueDateFrom || dueDateTo) {
        where.dueDate = {};
        if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
        if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
      }

      // Created by filter
      if (createdBy) {
        where.createdBy = createdBy;
      }

      // Full-text search
      let tasks: any[];
      let total: number;

      if (q && q.trim().length > 0) {
        // Use PostgreSQL full-text search
        const searchQuery = q.trim().replace(/[^\w\s]/g, ''); // Sanitize

        const rawQuery = `
          SELECT
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t."dueDate",
            t."projectId",
            t."createdAt",
            t."updatedAt",
            ts_rank(t.search_vector, plainto_tsquery('english', $1)) as relevance
          FROM tasks t
          INNER JOIN projects p ON t."projectId" = p.id
          WHERE t.search_vector @@ plainto_tsquery('english', $1)
            ${workspaceId ? `AND p."workspaceId" = $2` : ''}
            ${projectId ? `AND t."projectId" = '${projectId}'` : ''}
            ${status && status.length > 0 ? `AND t.status IN (${status.map(s => `'${s}'`).join(',')})` : ''}
            ${priority && priority.length > 0 ? `AND t.priority IN (${priority.map(p => `'${p}'`).join(',')})` : ''}
            ${dueDateFrom ? `AND t."dueDate" >= '${dueDateFrom}'` : ''}
            ${dueDateTo ? `AND t."dueDate" <= '${dueDateTo}'` : ''}
            ${createdBy ? `AND t."createdBy" = '${createdBy}'` : ''}
          ORDER BY ${sortBy === 'relevance' ? 'relevance' : `t."${sortBy}"`} ${sortOrder.toUpperCase()}
          LIMIT $${workspaceId ? 3 : 2}
          OFFSET $${workspaceId ? 4 : 3}
        `;

        const params = workspaceId
          ? [searchQuery, workspaceId, limit, offset]
          : [searchQuery, limit, offset];

        tasks = await prisma.$queryRawUnsafe(rawQuery, ...params);

        // Get total count
        const countQuery = `
          SELECT COUNT(*) as count
          FROM tasks t
          INNER JOIN projects p ON t."projectId" = p.id
          WHERE t.search_vector @@ plainto_tsquery('english', $1)
            ${workspaceId ? `AND p."workspaceId" = $2` : ''}
        `;
        const countResult: any = await prisma.$queryRawUnsafe(
          countQuery,
          ...(workspaceId ? [searchQuery, workspaceId] : [searchQuery])
        );
        total = parseInt(countResult[0].count);

      } else {
        // Regular filter-based search
        tasks = await prisma.task.findMany({
          where,
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
            labels: {
              include: {
                label: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: sortBy === 'relevance' ? { updatedAt: sortOrder } : { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
        });

        total = await prisma.task.count({ where });
      }

      // Transform results
      const taskResults: TaskSearchResult[] = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: task.projectId,
        projectName: task.project?.name || task.projectName || '',
        assignees: task.assignees?.map((a: any) => ({
          id: a.user?.id || a.userId,
          name: a.user?.name || '',
          avatar: a.user?.avatar || null,
        })) || [],
        labels: task.labels?.map((l: any) => ({
          id: l.label?.id || l.labelId,
          name: l.label?.name || '',
          color: l.label?.color || '#gray',
        })) || [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        relevance: task.relevance || undefined,
      }));

      return {
        tasks: taskResults,
        total,
        hasMore: offset + limit < total,
      };

    } catch (error) {
      logger.error('Search tasks failed', { error, query });
      throw new Error('Failed to search tasks');
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(query: string, workspaceId: string, limit: number = 10): Promise<string[]> {
    try {
      const searchQuery = query.trim().replace(/[^\w\s]/g, '');
      if (searchQuery.length < 2) return [];

      const results: any = await prisma.$queryRaw`
        SELECT DISTINCT
          ts_headline('english', title, plainto_tsquery('english', ${searchQuery})) as suggestion
        FROM tasks t
        INNER JOIN projects p ON t."projectId" = p.id
        WHERE t.search_vector @@ plainto_tsquery('english', ${searchQuery})
          AND p."workspaceId" = ${workspaceId}
        LIMIT ${limit}
      `;

      return results.map((r: any) => r.suggestion);

    } catch (error) {
      logger.error('Get search suggestions failed', { error, query, workspaceId });
      return [];
    }
  }

  /**
   * Create a saved filter
   */
  async createSavedFilter(userId: string, input: SavedFilterInput): Promise<SavedFilterResponse> {
    try {
      const savedFilter = await prisma.savedFilter.create({
        data: {
          name: input.name,
          description: input.description,
          workspaceId: input.workspaceId,
          createdBy: userId,
          isPublic: input.isPublic || false,
          filters: input.filters as any,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return savedFilter as any;

    } catch (error) {
      logger.error('Create saved filter failed', { error, userId, input });
      throw new Error('Failed to create saved filter');
    }
  }

  /**
   * Get saved filters for workspace
   */
  async getSavedFilters(userId: string, workspaceId: string): Promise<SavedFilterResponse[]> {
    try {
      const filters = await prisma.savedFilter.findMany({
        where: {
          workspaceId,
          OR: [
            { isPublic: true },
            { createdBy: userId },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return filters as any;

    } catch (error) {
      logger.error('Get saved filters failed', { error, userId, workspaceId });
      throw new Error('Failed to get saved filters');
    }
  }

  /**
   * Delete saved filter
   */
  async deleteSavedFilter(userId: string, filterId: string): Promise<void> {
    try {
      // Check if user owns the filter
      const filter = await prisma.savedFilter.findUnique({
        where: { id: filterId },
      });

      if (!filter) {
        throw new Error('Filter not found');
      }

      if (filter.createdBy !== userId) {
        throw new Error('Unauthorized to delete this filter');
      }

      await prisma.savedFilter.delete({
        where: { id: filterId },
      });

    } catch (error) {
      logger.error('Delete saved filter failed', { error, userId, filterId });
      throw error;
    }
  }

  /**
   * Update saved filter
   */
  async updateSavedFilter(
    userId: string,
    filterId: string,
    updates: Partial<SavedFilterInput>
  ): Promise<SavedFilterResponse> {
    try {
      // Check if user owns the filter
      const filter = await prisma.savedFilter.findUnique({
        where: { id: filterId },
      });

      if (!filter) {
        throw new Error('Filter not found');
      }

      if (filter.createdBy !== userId) {
        throw new Error('Unauthorized to update this filter');
      }

      const updated = await prisma.savedFilter.update({
        where: { id: filterId },
        data: {
          name: updates.name,
          description: updates.description,
          filters: updates.filters as any,
          isPublic: updates.isPublic,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return updated as any;

    } catch (error) {
      logger.error('Update saved filter failed', { error, userId, filterId, updates });
      throw error;
    }
  }
}

export const searchService = new SearchService();
