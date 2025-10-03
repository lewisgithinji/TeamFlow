import { prisma } from '@teamflow/database';
import { sendEmail } from '@teamflow/email';
import {
  CreateInvitationInput,
  AcceptInvitationInput,
  ResendInvitationInput,
  RevokeInvitationInput,
  InvitationListFilters,
  InvitationData,
} from '../types';
import { generateInvitationToken, generateInvitationExpiry, isTokenExpired } from '../utils/token';

export class InvitationService {
  /**
   * Create a new workspace invitation
   */
  async createInvitation(input: CreateInvitationInput): Promise<InvitationData> {
    const { workspaceId, email, role, invitedBy } = input;

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    // Check for pending invitation
    const pendingInvitation = await prisma.invitation.findFirst({
      where: {
        workspaceId,
        email,
        accepted: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvitation) {
      throw new Error('An active invitation already exists for this email');
    }

    // Create invitation
    const token = generateInvitationToken();
    const expiresAt = generateInvitationExpiry(7);

    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role,
        token,
        invitedBy,
        expiresAt,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Send invitation email
    await this.sendInvitationEmail(invitation);

    return invitation;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<InvitationData | null> {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return invitation;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(input: AcceptInvitationInput): Promise<void> {
    const { token, userId } = input;

    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.accepted) {
      throw new Error('Invitation has already been accepted');
    }

    if (isTokenExpired(invitation.expiresAt)) {
      throw new Error('Invitation has expired');
    }

    // Get user to verify email matches
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.email !== invitation.email) {
      throw new Error('Invitation email does not match user email');
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    // Accept invitation and add to workspace in a transaction
    await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          accepted: true,
          acceptedAt: new Date(),
        },
      }),
      prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      }),
      prisma.activity.create({
        data: {
          entityType: 'WORKSPACE',
          entityId: invitation.workspaceId,
          action: 'CREATED',
          userId,
          workspaceId: invitation.workspaceId,
          metadata: {
            type: 'member_joined',
            invitationId: invitation.id,
          },
        },
      }),
    ]);
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(input: ResendInvitationInput): Promise<InvitationData> {
    const { invitationId, workspaceId } = input;

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        workspaceId,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.accepted) {
      throw new Error('Cannot resend accepted invitation');
    }

    // Generate new token and expiry
    const token = generateInvitationToken();
    const expiresAt = generateInvitationExpiry(7);

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        token,
        expiresAt,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Resend email
    await this.sendInvitationEmail(updatedInvitation);

    return updatedInvitation;
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(input: RevokeInvitationInput): Promise<void> {
    const { invitationId, workspaceId } = input;

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        workspaceId,
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.accepted) {
      throw new Error('Cannot revoke accepted invitation');
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });
  }

  /**
   * List invitations for a workspace
   */
  async listInvitations(filters: InvitationListFilters): Promise<InvitationData[]> {
    const { workspaceId, accepted, email } = filters;

    const invitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        ...(accepted !== undefined && { accepted }),
        ...(email && { email: { contains: email, mode: 'insensitive' } }),
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(invitation: InvitationData): Promise<void> {
    if (!invitation.workspace) {
      throw new Error('Workspace information is required');
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;
    const inviterName = invitation.inviter?.name || 'A team member';

    await sendEmail({
      to: invitation.email,
      subject: `You've been invited to join ${invitation.workspace.name}`,
      template: 'workspace-invitation',
      data: {
        workspaceName: invitation.workspace.name,
        inviterName,
        inviteUrl,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  }
}

export const invitationService = new InvitationService();
