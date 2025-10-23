import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as searchController from './search.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/search/tasks
 * @desc    Search tasks with full-text search and filters
 * @access  Private
 */
router.get('/tasks', searchController.searchTasks);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions based on partial query
 * @access  Private
 */
router.get('/suggestions', searchController.getSearchSuggestions);

/**
 * @route   POST /api/search/filters
 * @desc    Create a saved filter
 * @access  Private
 */
router.post('/filters', searchController.createSavedFilter);

/**
 * @route   GET /api/search/filters/:workspaceId
 * @desc    Get saved filters for workspace
 * @access  Private
 */
router.get('/filters/:workspaceId', searchController.getSavedFilters);

/**
 * @route   PATCH /api/search/filters/:filterId
 * @desc    Update saved filter
 * @access  Private
 */
router.patch('/filters/:filterId', searchController.updateSavedFilter);

/**
 * @route   DELETE /api/search/filters/:filterId
 * @desc    Delete saved filter
 * @access  Private
 */
router.delete('/filters/:filterId', searchController.deleteSavedFilter);

export default router;
