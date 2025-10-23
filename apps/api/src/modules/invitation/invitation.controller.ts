import { Request, Response } from 'express';
import { WorkspaceRole } from '@teamflow/database';
import invitationService from './invitation.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { z } from 'zod';

/**
 * @route   POST /api/invitations
 * @desc    Create a new invitation
 * @access  Private (Owner/Admin only)
 */
export const createInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, email, role } = req.body;
  const userId = req.user!.id;

  const invitation = await invitationService.createInvitation(
    workspaceId,
    email.toLowerCase(),
    userId,
    role || 'MEMBER'
  );

  // TODO: Send invitation email
  // await sendInvitationEmail(invitation);

  res.status(201).json({
    success: true,
    data: invitation,
    message: 'Invitation sent successfully',
  });
});

/**
 * @route   POST /api/invitations/bulk
 * @desc    Create multiple invitations
 * @access  Private (Owner/Admin only)
 */
export const createBulkInvitations = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, emails, role } = req.body;
  const userId = req.user!.id;

  const results = await invitationService.createBulkInvitations(
    workspaceId,
    emails.map((e: string) => e.toLowerCase()),
    userId,
    role || 'MEMBER'
  );

  // TODO: Send invitation emails for successful invitations
  // for (const invitation of results.success) {
  //   await sendInvitationEmail(invitation);
  // }

  res.status(201).json({
    success: true,
    data: results,
    message: `${results.success.length} invitations sent, ${results.failed.length} failed`,
  });
});

/**
 * @route   GET /api/invitations/verify/:token
 * @desc    Validate an invitation token
 * @access  Public
 */
export const verifyInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const invitation = await invitationService.validateInvitation(token);

  res.status(200).json({
    success: true,
    data: {
      workspaceName: invitation.workspace.name,
      inviterName: invitation.inviter.name,
      role: invitation.role,
      email: invitation.email,
    },
  });
});

/**
 * @route   POST /api/invitations/accept/:token
 * @desc    Accept an invitation
 * @access  Private (Must be authenticated)
 */
export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const userId = req.user!.id;

  const workspaceMember = await invitationService.acceptInvitation(token, userId);

  res.status(200).json({
    success: true,
    data: workspaceMember,
    message: 'Successfully joined workspace',
  });
});

/**
 * @route   POST /api/invitations/decline/:token
 * @desc    Decline an invitation
 * @access  Public
 */
export const declineInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  await invitationService.declineInvitation(token);

  res.status(200).json({
    success: true,
    message: 'Invitation declined',
  });
});

/**
 * @route   DELETE /api/invitations/:invitationId
 * @desc    Revoke an invitation
 * @access  Private (Owner/Admin only)
 */
export const revokeInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { invitationId } = req.params;
  const userId = req.user!.id;

  await invitationService.revokeInvitation(invitationId, userId);

  res.status(200).json({
    success: true,
    message: 'Invitation revoked successfully',
  });
});

/**
 * @route   GET /api/invitations/workspace/:workspaceId
 * @desc    List pending invitations for a workspace
 * @access  Private (Owner/Admin only)
 */
export const listWorkspaceInvitations = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  const invitations = await invitationService.listPendingInvitations(workspaceId, userId);

  res.status(200).json({
    success: true,
    data: invitations,
  });
});
