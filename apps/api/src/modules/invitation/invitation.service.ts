import { PrismaClient, WorkspaceRole } from '@teamflow/database';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class InvitationService {
  /**
   * Create a new workspace invitation
   */
  async createInvitation(
    workspaceId: string,
    email: string,
    inviterId: string,
    role: WorkspaceRole = 'MEMBER'
  ) {
    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if inviter has permission (Owner or Admin)
    const inviterMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: inviterId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!inviterMember && workspace.ownerId !== inviterId) {
      throw new Error('Only workspace owners and admins can invite members');
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        workspaceId,
        email,
        accepted: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new Error('An invitation is already pending for this email');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role,
        invitedBy: inviterId,
        token,
        expiresAt,
      },
      include: {
        workspace: true,
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return invitation;
  }

  /**
   * Create multiple invitations (bulk invite)
   */
  async createBulkInvitations(
    workspaceId: string,
    emails: string[],
    inviterId: string,
    role: WorkspaceRole = 'MEMBER'
  ) {
    const results = {
      success: [] as any[],
      failed: [] as { email: string; error: string }[],
    };

    for (const email of emails) {
      try {
        const invitation = await this.createInvitation(
          workspaceId,
          email,
          inviterId,
          role
        );
        results.success.push(invitation);
      } catch (error) {
        results.failed.push({
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Validate an invitation token
   */
  async validateInvitation(token: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: true,
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.accepted) {
      throw new Error('This invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('This invitation has expired');
    }

    return invitation;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: string) {
    // Validate invitation
    const invitation = await this.validateInvitation(token);

    // Check if user email matches invitation email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
      },
    });

    if (existingMember) {
      throw new Error('You are already a member of this workspace');
    }

    // Accept invitation and add user to workspace
    const [updatedInvitation, workspaceMember] = await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          accepted: true,
          acceptedAt: new Date(),
        },
      }),
      prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role,
        },
        include: {
          workspace: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    // Create activity log
    await prisma.activity.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        entityType: 'WORKSPACE',
        entityId: invitation.workspaceId,
        action: 'CREATED',
        metadata: {
          message: `${user.name} joined the workspace`,
          role: invitation.role,
        },
      },
    });

    return workspaceMember;
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(token: string) {
    // Validate invitation
    const invitation = await this.validateInvitation(token);

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: invitation.id },
    });

    return { message: 'Invitation declined successfully' };
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { workspace: true },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check if user has permission to revoke
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: invitation.workspaceId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member && invitation.workspace.ownerId !== userId) {
      throw new Error('Only workspace owners and admins can revoke invitations');
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation revoked successfully' };
  }

  /**
   * List pending invitations for a workspace
   */
  async listPendingInvitations(workspaceId: string, userId: string) {
    // Check if user has permission to view invitations
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!member && workspace?.ownerId !== userId) {
      throw new Error('Only workspace owners and admins can view invitations');
    }

    // Get pending invitations
    const invitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        accepted: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }
}

export default new InvitationService();
