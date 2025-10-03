import { z } from 'zod';
import { WorkspaceRole } from '@teamflow/database';

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  newRole: z.nativeEnum(WorkspaceRole, {
    errorMap: () => ({ message: 'Invalid workspace role' }),
  }),
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
});

export const listMembersSchema = z.object({
  role: z.nativeEnum(WorkspaceRole).optional(),
  search: z.string().optional(),
});
