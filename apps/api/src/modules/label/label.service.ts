import { prisma } from '@teamflow/database';
import { WorkspaceRole } from '@teamflow/database';

/**
 * Verify user has access to workspace
 */
async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  return member;
}

/**
 * List all labels for a workspace
 */
export async function listLabels(workspaceId: string, userId: string) {
  await verifyWorkspaceAccess(workspaceId, userId);

  const labels = await prisma.label.findMany({
    where: {
      workspaceId,
    },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return labels;
}

/**
 * Create a new label
 */
export async function createLabel(
  workspaceId: string,
  userId: string,
  data: { name: string; color: string }
) {
  const member = await verifyWorkspaceAccess(workspaceId, userId);

  // Only OWNER and ADMIN can create labels
  if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
    throw new Error('Only workspace owners and admins can create labels');
  }

  // Check if label name already exists
  const existingLabel = await prisma.label.findUnique({
    where: {
      workspaceId_name: {
        workspaceId,
        name: data.name,
      },
    },
  });

  if (existingLabel) {
    throw new Error('A label with this name already exists');
  }

  const label = await prisma.label.create({
    data: {
      workspaceId,
      name: data.name,
      color: data.color,
    },
  });

  return label;
}

/**
 * Update a label
 */
export async function updateLabel(
  labelId: string,
  userId: string,
  data: { name?: string; color?: string }
) {
  // Get the label
  const label = await prisma.label.findUnique({
    where: { id: labelId },
  });

  if (!label) {
    throw new Error('Label not found');
  }

  const member = await verifyWorkspaceAccess(label.workspaceId, userId);

  // Only OWNER and ADMIN can update labels
  if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
    throw new Error('Only workspace owners and admins can update labels');
  }

  // If updating name, check for duplicates
  if (data.name && data.name !== label.name) {
    const existingLabel = await prisma.label.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: label.workspaceId,
          name: data.name,
        },
      },
    });

    if (existingLabel) {
      throw new Error('A label with this name already exists');
    }
  }

  const updatedLabel = await prisma.label.update({
    where: { id: labelId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.color && { color: data.color }),
    },
  });

  return updatedLabel;
}

/**
 * Delete a label
 */
export async function deleteLabel(labelId: string, userId: string) {
  // Get the label
  const label = await prisma.label.findUnique({
    where: { id: labelId },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  if (!label) {
    throw new Error('Label not found');
  }

  const member = await verifyWorkspaceAccess(label.workspaceId, userId);

  // Only OWNER and ADMIN can delete labels
  if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
    throw new Error('Only workspace owners and admins can delete labels');
  }

  // Delete the label (TaskLabel entries will be cascaded)
  await prisma.label.delete({
    where: { id: labelId },
  });

  return { success: true, tasksAffected: label._count.tasks };
}
