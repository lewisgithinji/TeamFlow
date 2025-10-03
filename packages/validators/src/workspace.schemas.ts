import { z } from 'zod';
import { WorkspaceRole } from './enums';

// Create Workspace
export const createWorkspaceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  logo: z.string().url().optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

// Update Workspace
export const updateWorkspaceSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  settings: z.record(z.any()).optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

// Invite Member
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: WorkspaceRole.default('MEMBER'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// Update Member Role
export const updateMemberRoleSchema = z.object({
  role: WorkspaceRole,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
