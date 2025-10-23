import { Request, Response } from 'express';
import { searchService } from './search.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { SearchQuery, SavedFilterInput } from './search.types';

/**
 * Search tasks with full-text search and filters
 * GET /api/search/tasks
 */
export const searchTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const query: SearchQuery = {
    q: req.query.q as string,
    workspaceId: req.query.workspaceId as string,
    projectId: req.query.projectId as string,
    status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
    priority: req.query.priority ? (req.query.priority as string).split(',') as any : undefined,
    assigneeId: req.query.assigneeId ? (req.query.assigneeId as string).split(',') : undefined,
    labelId: req.query.labelId ? (req.query.labelId as string).split(',') : undefined,
    dueDateFrom: req.query.dueDateFrom as string,
    dueDateTo: req.query.dueDateTo as string,
    createdBy: req.query.createdBy as string,
    sortBy: (req.query.sortBy as any) || 'relevance',
    sortOrder: (req.query.sortOrder as any) || 'desc',
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
  };

  const results = await searchService.searchTasks(query);

  res.json({
    success: true,
    data: results,
  });
});

/**
 * Get search suggestions
 * GET /api/search/suggestions
 */
export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { q, workspaceId } = req.query;

  if (!q || !workspaceId) {
    return res.status(400).json({
      success: false,
      error: 'Query and workspaceId are required',
    });
  }

  const suggestions = await searchService.getSearchSuggestions(
    q as string,
    workspaceId as string,
    parseInt(req.query.limit as string) || 10
  );

  res.json({
    success: true,
    data: suggestions,
  });
});

/**
 * Create saved filter
 * POST /api/search/filters
 */
export const createSavedFilter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const input: SavedFilterInput = req.body;

  const savedFilter = await searchService.createSavedFilter(userId, input);

  res.status(201).json({
    success: true,
    data: savedFilter,
  });
});

/**
 * Get saved filters for workspace
 * GET /api/search/filters/:workspaceId
 */
export const getSavedFilters = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { workspaceId } = req.params;

  const filters = await searchService.getSavedFilters(userId, workspaceId);

  res.json({
    success: true,
    data: filters,
  });
});

/**
 * Update saved filter
 * PATCH /api/search/filters/:filterId
 */
export const updateSavedFilter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { filterId } = req.params;
  const updates: Partial<SavedFilterInput> = req.body;

  const updated = await searchService.updateSavedFilter(userId, filterId, updates);

  res.json({
    success: true,
    data: updated,
  });
});

/**
 * Delete saved filter
 * DELETE /api/search/filters/:filterId
 */
export const deleteSavedFilter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { filterId } = req.params;

  await searchService.deleteSavedFilter(userId, filterId);

  res.json({
    success: true,
    message: 'Filter deleted successfully',
  });
});
