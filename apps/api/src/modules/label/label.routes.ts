import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { listLabels, createLabel, updateLabel, deleteLabel } from './label.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createLabelSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * GET /workspaces/:workspaceId/labels
 * List all labels for a workspace
 */
router.get('/workspaces/:workspaceId/labels', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const labels = await listLabels(workspaceId, userId);

    res.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /workspaces/:workspaceId/labels
 * Create a new label
 */
router.post(
  '/workspaces/:workspaceId/labels',
  validate(createLabelSchema),
  async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.id;
      const { name, color } = req.body;

      const label = await createLabel(workspaceId, userId, { name, color });

      res.status(201).json({
        success: true,
        message: 'Label created successfully',
        data: label,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /labels/:labelId
 * Update a label
 */
router.patch(
  '/labels/:labelId',
  validate(updateLabelSchema),
  async (req, res, next) => {
    try {
      const { labelId } = req.params;
      const userId = req.user!.id;
      const { name, color } = req.body;

      const label = await updateLabel(labelId, userId, { name, color });

      res.json({
        success: true,
        message: 'Label updated successfully',
        data: label,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /labels/:labelId
 * Delete a label
 */
router.delete('/labels/:labelId', async (req, res, next) => {
  try {
    const { labelId } = req.params;
    const userId = req.user!.id;

    const result = await deleteLabel(labelId, userId);

    res.json({
      success: true,
      message: `Label deleted successfully. ${result.tasksAffected} task(s) were affected.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
