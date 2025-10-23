import { Router } from 'express';
import * as slackController from './slack.controller';
import * as slackWebhook from './slack.webhook';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  updateIntegrationSettingsSchema,
  createChannelMappingSchema,
  updateChannelMappingSchema,
  updateUserPreferencesSchema,
} from './slack.types';

const router = Router();

// =============================================
// OAuth Routes
// =============================================

/**
 * @route   GET /api/slack/oauth/start
 * @desc    Initiate Slack OAuth flow
 * @access  Private (requires OWNER/ADMIN role)
 * @query   workspaceId - TeamFlow workspace ID
 */
router.get('/oauth/start', authenticate, slackController.startOAuth);

/**
 * @route   GET /api/slack/oauth/callback
 * @desc    Handle Slack OAuth callback (redirects to frontend)
 * @access  Public
 * @query   code - OAuth authorization code
 * @query   state - OAuth state parameter
 */
router.get('/oauth/callback', slackController.handleOAuthCallback);

/**
 * @route   POST /api/slack/oauth/complete
 * @desc    Complete OAuth flow (called by frontend after callback)
 * @access  Private (requires OWNER/ADMIN role)
 * @body    { code, state, workspaceId }
 */
router.post('/oauth/complete', authenticate, slackController.completeOAuth);

// =============================================
// Integration Management Routes
// =============================================

/**
 * @route   GET /api/slack/integration/:workspaceId
 * @desc    Get Slack integration status for a workspace
 * @access  Private
 */
router.get('/integration/:workspaceId', authenticate, slackController.getIntegrationStatus);

/**
 * @route   PATCH /api/slack/integration/:integrationId
 * @desc    Update integration settings
 * @access  Private (requires OWNER/ADMIN role)
 * @body    { defaultChannelId?, defaultChannelName?, isActive? }
 */
router.patch(
  '/integration/:integrationId',
  authenticate,
  validate(updateIntegrationSettingsSchema),
  slackController.updateIntegrationSettings
);

/**
 * @route   DELETE /api/slack/integration/:integrationId
 * @desc    Disconnect Slack integration
 * @access  Private (requires OWNER/ADMIN role)
 */
router.delete('/integration/:integrationId', authenticate, slackController.disconnectIntegration);

// =============================================
// Channel Management Routes
// =============================================

/**
 * @route   GET /api/slack/integration/:integrationId/channels
 * @desc    List available Slack channels
 * @access  Private
 * @query   cursor? - Pagination cursor
 */
router.get('/integration/:integrationId/channels', authenticate, slackController.listChannels);

/**
 * @route   POST /api/slack/integration/:integrationId/channels
 * @desc    Create channel mapping
 * @access  Private (requires OWNER/ADMIN role)
 * @body    { channelId, channelName, projectId?, notifyOnAssignment?, ... }
 */
router.post(
  '/integration/:integrationId/channels',
  authenticate,
  validate(createChannelMappingSchema),
  slackController.createChannelMapping
);

/**
 * @route   PATCH /api/slack/channels/:mappingId
 * @desc    Update channel mapping settings
 * @access  Private (requires OWNER/ADMIN role)
 * @body    { notifyOnAssignment?, notifyOnStatusChange?, ... }
 */
router.patch(
  '/channels/:mappingId',
  authenticate,
  validate(updateChannelMappingSchema),
  slackController.updateChannelMapping
);

/**
 * @route   DELETE /api/slack/channels/:mappingId
 * @desc    Delete channel mapping
 * @access  Private (requires OWNER/ADMIN role)
 */
router.delete('/channels/:mappingId', authenticate, slackController.deleteChannelMapping);

// =============================================
// User Preferences Routes
// =============================================

/**
 * @route   GET /api/slack/integration/:integrationId/preferences
 * @desc    Get user's Slack notification preferences
 * @access  Private
 */
router.get(
  '/integration/:integrationId/preferences',
  authenticate,
  slackController.getUserPreferences
);

/**
 * @route   PATCH /api/slack/integration/:integrationId/preferences
 * @desc    Update user's Slack notification preferences
 * @access  Private
 * @body    { enableDMs?, frequency?, notifyOnAssignment?, quietHours?, ... }
 */
router.patch(
  '/integration/:integrationId/preferences',
  authenticate,
  validate(updateUserPreferencesSchema),
  slackController.updateUserPreferences
);

// =============================================
// Webhook Routes (for Slack to call)
// =============================================

/**
 * @route   POST /api/slack/webhook/interactions
 * @desc    Handle interactive message callbacks (button clicks, etc.)
 * @access  Public (verified via Slack signature)
 */
router.post('/webhook/interactions', slackWebhook.handleInteractions);

/**
 * @route   POST /api/slack/webhook/commands
 * @desc    Handle Slack slash commands (future feature)
 * @access  Public (verified via Slack signature)
 */
router.post('/webhook/commands', slackWebhook.handleSlashCommands);

export default router;
