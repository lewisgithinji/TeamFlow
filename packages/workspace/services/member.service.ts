import { prisma, WorkspaceRole } from '@teamflow/database';
import {
  WorkspaceMemberData,
  UpdateMemberRoleInput,
  RemoveMemberInput,
  ListMembersFilters,
  PermissionCheck,
} from '../types';
import { canManageMember, hasPermission } from '../utils/permissions';

export class MemberService {
  /**
   * Get a workspace member by ID
   */
  async getMember(memberId: string, workspaceId: string): Promise<WorkspaceMemberData | null> {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return member;
  }

  /**
   * List all members in a workspace
   */
  async listMembers(filters: ListMembersFilters): Promise<WorkspaceMemberData[]> {
    const { workspaceId, role, search } = filters;

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        ...(role && { role }),
        ...(search && {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ role: 'desc' }, { joinedAt: 'asc' }],
    });

    return members;
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(input: UpdateMemberRoleInput): Promise<WorkspaceMemberData> {
    const { workspaceId, memberId, newRole, updatedBy } = input;

    // Get the actor (person making the change)
    const actor = await prisma.workspaceMember.findFirst({
      where: {
        userId: updatedBy,
        workspaceId,
      },
    });

    if (!actor) {
      throw new Error('You are not a member of this workspace');
    }

    // Get the target member
    const targetMember = await prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
    });

    if (!targetMember) {
      throw new Error('Member not found');
    }

    // Check permissions
    if (!canManageMember(actor.role, targetMember.role)) {
      throw new Error('You do not have permission to update this member\'s role');
    }

    // Prevent changing owner role
    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new Error('Cannot change the role of workspace owner');
    }

    // Prevent setting owner role (must use transfer ownership)
    if (newRole === WorkspaceRole.OWNER) {
      throw new Error('Cannot set owner role directly. Use transfer ownership instead');
    }

    // Update the role
    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        entityType: 'WORKSPACE',
        entityId: workspaceId,
        action: 'UPDATED',
        userId: updatedBy,
        workspaceId,
        metadata: {
          type: 'member_role_changed',
          memberId,
          oldRole: targetMember.role,
          newRole,
        },
      },
    });

    return updatedMember;
  }

  /**
   * Remove a member from workspace
   */
  async removeMember(input: RemoveMemberInput): Promise<void> {
    const { workspaceId, memberId, removedBy } = input;

    // Get the actor (person removing)
    const actor = await prisma.workspaceMember.findFirst({
      where: {
        userId: removedBy,
        workspaceId,
      },
    });

    if (!actor) {
      throw new Error('You are not a member of this workspace');
    }

    // Get the target member
    const targetMember = await prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetMember) {
      throw new Error('Member not found');
    }

    // Check permissions
    if (!canManageMember(actor.role, targetMember.role)) {
      throw new Error('You do not have permission to remove this member');
    }

    // Prevent removing owner
    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new Error('Cannot remove workspace owner. Transfer ownership first');
    }

    // Remove the member
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        entityType: 'WORKSPACE',
        entityId: workspaceId,
        action: 'DELETED',
        userId: removedBy,
        workspaceId,
        metadata: {
          type: 'member_removed',
          memberId,
          memberName: targetMember.user.name,
          memberEmail: targetMember.user.email,
        },
      },
    });
  }

  /**
   * Check if a user has permission to access a workspace
   */
  async checkPermission(check: PermissionCheck): Promise<boolean> {
    const { userId, workspaceId, requiredRole } = check;

    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
      },
    });

    if (!member) {
      return false;
    }

    if (requiredRole) {
      return hasPermission(member.role, requiredRole);
    }

    return true;
  }

  /**
   * Get a user's role in a workspace
   */
  async getUserRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
      },
      select: {
        role: true,
      },
    });

    return member?.role || null;
  }
}

export const memberService = new MemberService();
