import { z } from 'zod';
import { WorkspaceRole } from '@teamflow/database';

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(WorkspaceRole, {
    errorMap: () => ({ message: 'Invalid workspace role' }),
  }),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const resendInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
});

export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
});

export const listInvitationsSchema = z.object({
  accepted: z.boolean().optional(),
  email: z.string().optional(),
});
