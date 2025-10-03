/**
 * Project Service
 * Reference: Sprint 1 Planning - User Story 2.4 (Tasks 2.4.2-2.4.4)
 * Handles project business logic
 */

import { PrismaClient } from '@teamflow/database';

const prisma = new PrismaClient();

interface CreateProjectInput {
  name: string;
  description?: string;
  icon?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  icon?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  archived?: boolean;
}

/**
 * Create a new project in a workspace
 * Reference: Sprint 1 Planning - Task 2.4.2
 * Acceptance Criteria:
 * - User can create project with name, description, icon
 * - Project name required (3-100 characters)
 * - Project creator is automatically Admin of that project
 */
export async function createProject(
  userId: string,
  workspaceId: string,
  data: CreateProjectInput
) {
  // Verify user is a member of the workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this workspace');
  }

  // Create the project
  const project = await prisma.project.create({
    data: {
      workspaceId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      visibility: data.visibility || 'PUBLIC',
      createdBy: userId,
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  // Return project with task count
  return {
    ...project,
    taskCount: project._count.tasks,
  };
}

/**
 * List all projects in a workspace
 * Reference: Sprint 1 Planning - Task 2.4.3
 * Acceptance Criteria:
 * - Filter by workspace
 * - Check user permission
 * - Return project list with counts
 */
export async function listWorkspaceProjects(userId: string, workspaceId: string) {
  // Verify user is a member of the workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this workspace');
  }

  // Get all projects in workspace
  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
      archived: false, // Don't show archived projects by default
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform to include task count
  return projects.map((project) => ({
    ...project,
    taskCount: project._count.tasks,
  }));
}

/**
 * Get project details by ID
 * Reference: Sprint 1 Planning - Task 2.4.4
 * Acceptance Criteria:
 * - Check user permission
 * - Return project details with stats
 */
export async function getProjectById(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          sprints: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Check if user is a member of the workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: project.workspaceId,
    },
  });

  if (!membership) {
    throw new Error('You do not have access to this project');
  }

  // Return project with counts
  return {
    ...project,
    taskCount: project._count.tasks,
    sprintCount: project._count.sprints,
  };
}

/**
 * Update project details
 * Reference: Sprint 1 Planning - Task 2.4.2 (update capability)
 */
export async function updateProject(
  userId: string,
  projectId: string,
  data: UpdateProjectInput
) {
  // Get project first to check workspace membership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Check if user is workspace member (Owner/Admin can update)
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: project.workspaceId,
    },
  });

  if (!membership) {
    throw new Error('You do not have permission to update this project');
  }

  // Only Owner/Admin can update
  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
    throw new Error('Only workspace owners and admins can update projects');
  }

  // Update the project
  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  return {
    ...updated,
    taskCount: updated._count.tasks,
  };
}

/**
 * Delete/archive project
 * Reference: Sprint 1 Planning - Task 2.4.2 (delete capability)
 */
export async function deleteProject(userId: string, projectId: string) {
  // Get project first to check workspace membership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Check if user is workspace Owner
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: project.workspaceId,
      role: 'OWNER',
    },
  });

  if (!membership) {
    throw new Error('Only workspace owners can delete projects');
  }

  // Archive instead of hard delete (soft delete pattern)
  await prisma.project.update({
    where: { id: projectId },
    data: { archived: true },
  });

  return { message: 'Project archived successfully' };
}
