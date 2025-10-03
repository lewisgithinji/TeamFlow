import { WorkspaceRole } from '@teamflow/database';

/**
 * Role hierarchy (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  [WorkspaceRole.VIEWER]: 1,
  [WorkspaceRole.MEMBER]: 2,
  [WorkspaceRole.ADMIN]: 3,
  [WorkspaceRole.OWNER]: 4,
};

/**
 * Check if a role has at least the required permission level
 */
export function hasPermission(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a user can perform an action on a target user
 */
export function canManageMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean {
  // Owner can manage anyone
  if (actorRole === WorkspaceRole.OWNER) {
    return true;
  }

  // Admin can manage MEMBER and VIEWER
  if (actorRole === WorkspaceRole.ADMIN) {
    return targetRole === WorkspaceRole.MEMBER || targetRole === WorkspaceRole.VIEWER;
  }

  // MEMBER and VIEWER cannot manage anyone
  return false;
}

/**
 * Get allowed actions for a role
 */
export function getAllowedActions(role: WorkspaceRole): string[] {
  const actions: Record<WorkspaceRole, string[]> = {
    [WorkspaceRole.VIEWER]: [
      'workspace:read',
      'project:read',
      'task:read',
      'comment:read',
    ],
    [WorkspaceRole.MEMBER]: [
      'workspace:read',
      'project:read',
      'project:create',
      'task:read',
      'task:create',
      'task:update',
      'task:assign',
      'comment:read',
      'comment:create',
      'comment:update_own',
      'comment:delete_own',
    ],
    [WorkspaceRole.ADMIN]: [
      'workspace:read',
      'workspace:update',
      'project:read',
      'project:create',
      'project:update',
      'project:delete',
      'task:read',
      'task:create',
      'task:update',
      'task:delete',
      'task:assign',
      'comment:read',
      'comment:create',
      'comment:update',
      'comment:delete',
      'member:invite',
      'member:remove',
      'member:update_role',
    ],
    [WorkspaceRole.OWNER]: [
      'workspace:read',
      'workspace:update',
      'workspace:delete',
      'workspace:transfer',
      'project:read',
      'project:create',
      'project:update',
      'project:delete',
      'task:read',
      'task:create',
      'task:update',
      'task:delete',
      'task:assign',
      'comment:read',
      'comment:create',
      'comment:update',
      'comment:delete',
      'member:invite',
      'member:remove',
      'member:update_role',
      'integration:manage',
    ],
  };

  return actions[role] || [];
}

/**
 * Check if a role can perform a specific action
 */
export function canPerformAction(role: WorkspaceRole, action: string): boolean {
  const allowedActions = getAllowedActions(role);
  return allowedActions.includes(action);
}
