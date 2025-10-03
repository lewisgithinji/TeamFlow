import { WorkspaceRole } from '@teamflow/database';

export interface WorkspaceMemberData {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface UpdateMemberRoleInput {
  workspaceId: string;
  memberId: string;
  newRole: WorkspaceRole;
  updatedBy: string;
}

export interface RemoveMemberInput {
  workspaceId: string;
  memberId: string;
  removedBy: string;
}

export interface ListMembersFilters {
  workspaceId: string;
  role?: WorkspaceRole;
  search?: string;
}

export interface PermissionCheck {
  userId: string;
  workspaceId: string;
  requiredRole?: WorkspaceRole;
  action?: string;
}
