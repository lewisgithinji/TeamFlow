import { Router } from 'express';
import * as invitationController from './invitation.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createInvitationSchema = z.object({
  body: z.object({
    workspaceId: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional(),
  }),
});

const bulkInvitationSchema = z.object({
  body: z.object({
    workspaceId: z.string().uuid(),
    emails: z.array(z.string().email()).min(1).max(50),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional(),
  }),
});

/**
 * @route   POST /api/invitations
 * @desc    Create a new invitation
 * @access  Private (Owner/Admin only)
 */
router.post(
  '/',
  authenticate,
  validate(createInvitationSchema),
  invitationController.createInvitation
);

/**
 * @route   POST /api/invitations/bulk
 * @desc    Create multiple invitations
 * @access  Private (Owner/Admin only)
 */
router.post(
  '/bulk',
  authenticate,
  validate(bulkInvitationSchema),
  invitationController.createBulkInvitations
);

/**
 * @route   GET /api/invitations/verify/:token
 * @desc    Validate an invitation token
 * @access  Public
 */
router.get('/verify/:token', invitationController.verifyInvitation);

/**
 * @route   POST /api/invitations/accept/:token
 * @desc    Accept an invitation
 * @access  Private
 */
router.post('/accept/:token', authenticate, invitationController.acceptInvitation);

/**
 * @route   POST /api/invitations/decline/:token
 * @desc    Decline an invitation
 * @access  Public
 */
router.post('/decline/:token', invitationController.declineInvitation);

/**
 * @route   DELETE /api/invitations/:invitationId
 * @desc    Revoke an invitation
 * @access  Private (Owner/Admin only)
 */
router.delete('/:invitationId', authenticate, invitationController.revokeInvitation);

/**
 * @route   GET /api/invitations/workspace/:workspaceId
 * @desc    List pending invitations for a workspace
 * @access  Private (Owner/Admin only)
 */
router.get(
  '/workspace/:workspaceId',
  authenticate,
  invitationController.listWorkspaceInvitations
);

export default router;
