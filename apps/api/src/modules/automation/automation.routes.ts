import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import {
  CreateAutomationRuleSchema,
  ListAutomationRulesQuerySchema,
} from './automation.dto';
import {
  createAutomationRule,
  getAutomationRule,
  listAutomationRules,
} from './automation.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /workspaces/:workspaceId/automation/rules
 * List all automation rules for a workspace
 */
router.get('/workspaces/:workspaceId/automation/rules', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    // Validate query parameters
    const query = ListAutomationRulesQuerySchema.parse(req.query);

    const result = await listAutomationRules(workspaceId, query, userId);

    res.json({
      success: true,
      data: result.rules,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /workspaces/:workspaceId/automation/rules/:ruleId
 * Get a single automation rule by ID
 */
router.get('/workspaces/:workspaceId/automation/rules/:ruleId', async (req, res, next) => {
  try {
    const { workspaceId, ruleId } = req.params;
    const userId = req.user!.id;

    const rule = await getAutomationRule(ruleId, workspaceId, userId);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /workspaces/:workspaceId/automation/rules
 * Create a new automation rule
 */
router.post('/workspaces/:workspaceId/automation/rules', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    // Validate request body
    const data = CreateAutomationRuleSchema.parse(req.body);

    const rule = await createAutomationRule(workspaceId, data, userId);

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Automation rule created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /workspaces/:workspaceId/automation/rules/:ruleId
 * Update an existing automation rule
 */
router.patch('/workspaces/:workspaceId/automation/rules/:ruleId', async (req, res, next) => {
  try {
    const { workspaceId, ruleId } = req.params;
    const userId = req.user!.id;

    // Validate request body
    const data = CreateAutomationRuleSchema.parse(req.body);

    const { updateAutomationRule } = await import('./automation.service');
    const rule = await updateAutomationRule(ruleId, workspaceId, data, userId);

    res.json({
      success: true,
      data: rule,
      message: 'Automation rule updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /workspaces/:workspaceId/automation/rules/:ruleId
 * Delete an automation rule
 */
router.delete('/workspaces/:workspaceId/automation/rules/:ruleId', async (req, res, next) => {
  try {
    const { workspaceId, ruleId } = req.params;
    const userId = req.user!.id;

    const { deleteAutomationRule } = await import('./automation.service');
    await deleteAutomationRule(ruleId, workspaceId, userId);

    res.json({
      success: true,
      message: 'Automation rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
