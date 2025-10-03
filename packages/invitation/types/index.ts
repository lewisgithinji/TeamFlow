import { WorkspaceRole } from '@teamflow/database';

export interface InvitationData {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedBy: string | null;
  expiresAt: Date;
  accepted: boolean;
  acceptedAt: Date | null;
  createdAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

export interface CreateInvitationInput {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
}

export interface AcceptInvitationInput {
  token: string;
  userId: string;
}

export interface ResendInvitationInput {
  invitationId: string;
  workspaceId: string;
}

export interface RevokeInvitationInput {
  invitationId: string;
  workspaceId: string;
}

export interface InvitationListFilters {
  workspaceId: string;
  accepted?: boolean;
  email?: string;
}
