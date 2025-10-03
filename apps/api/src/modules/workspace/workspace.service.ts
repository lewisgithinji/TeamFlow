import { prisma } from '@teamflow/database';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '@teamflow/validators';

/**
 * Generate unique slug from workspace name
 * Reference: Sprint 1 Planning - Task 2.1.2
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Create a new workspace
 * Reference: Sprint 1 Planning - Task 2.1.2
 * Acceptance Criteria:
 * - User who creates workspace is automatically Owner
 * - Workspace has unique URL slug
 */
export async function createWorkspace(userId: string, data: CreateWorkspaceInput) {
  // Generate unique slug from name
  const baseSlug = generateSlug(data.name);
  const slug = await ensureUniqueSlug(baseSlug);

  // Create workspace and add creator as owner in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the workspace
    const workspace = await tx.workspace.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        logo: data.logo,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    // Add creator as workspace member with OWNER role
    await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });

    // TODO: Log activity once Activity schema is fixed to support WORKSPACE entities
    // Currently disabled due to foreign key constraint issue with entityId -> Task relation

    // Return workspace with role and counts (matching listUserWorkspaces format)
    return {
      ...workspace,
      role: 'OWNER' as const,
      memberCount: workspace._count.members,
      projectCount: workspace._count.projects,
      joinedAt: new Date(),
    };
  });

  return result;
}

/**
 * List all workspaces for a user
 * Reference: Sprint 1 Planning - Task 2.1.3
 * Acceptance Criteria:
 * - Multiple workspaces supported per user
 * - Include user's role in each workspace
 */
export async function listUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId,
    },
    include: {
      workspace: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  return memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    description: membership.workspace.description,
    logo: membership.workspace.logo,
    role: membership.role,
    owner: membership.workspace.owner,
    memberCount: membership.workspace._count.members,
    projectCount: membership.workspace._count.projects,
    joinedAt: membership.joinedAt,
    createdAt: membership.workspace.createdAt,
  }));
}

/**
 * Get workspace details
 * Reference: Sprint 1 Planning - Task 2.1.4
 */
export async function getWorkspaceById(workspaceId: string, userId: string) {
  // Check if user is a member
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error('You do not have access to this workspace');
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      members: {
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
        orderBy: {
          joinedAt: 'asc',
        },
      },
      _count: {
        select: {
          projects: true,
          labels: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return {
    ...workspace,
    userRole: membership.role,
  };
}

/**
 * Update workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  data: UpdateWorkspaceInput
) {
  // Check if user is owner or admin
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw new Error('You do not have permission to update this workspace');
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });

  // TODO: Log activity once Activity schema is fixed to support WORKSPACE entities
  // Currently disabled due to foreign key constraint issue with entityId -> Task relation

  return workspace;
}

/**
 * Delete workspace (owner only)
 */
export async function deleteWorkspace(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  if (workspace.ownerId !== userId) {
    throw new Error('Only the workspace owner can delete the workspace');
  }

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  return { message: 'Workspace deleted successfully' };
}
