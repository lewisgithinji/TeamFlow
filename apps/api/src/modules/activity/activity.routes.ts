import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as activityController from './activity.controller';

const router = Router();

// All activity routes require authentication
router.use(authenticate);

// GET /api/activities - Get activities with filters
router.get('/', activityController.getActivities);

// GET /api/activities/:id - Get activity by ID
router.get('/:id', activityController.getActivityById);

// POST /api/activities - Create activity
router.post('/', activityController.createActivity);

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', activityController.deleteActivity);

export default router;
