import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceRole } from '@teamflow/database';
import { memberService, hasPermission, canPerformAction } from '@teamflow/workspace';

export interface PermissionCheckOptions {
  workspaceId?: string;
  requiredRole?: WorkspaceRole;
  action?: string;
  allowSelf?: boolean; // Allow if the user is acting on themselves
  getSelfId?: (request: NextRequest) => string | null; // Function to get the ID of the resource owner
}

/**
 * Middleware to check user permissions for workspace actions
 */
export async function checkPermission(
  request: NextRequest,
  options: PermissionCheckOptions
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { workspaceId, requiredRole, action, allowSelf, getSelfId } = options;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Get user's role in the workspace
    const userRole = await memberService.getUserRole(userId, workspaceId);

    if (!userRole) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    // Check if user is acting on themselves (if allowSelf is true)
    if (allowSelf && getSelfId) {
      const selfId = getSelfId(request);
      if (selfId === userId) {
        return null; // Allow
      }
    }

    // Check role-based permission
    if (requiredRole) {
      if (!hasPermission(userRole, requiredRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Check action-based permission
    if (action) {
      if (!canPerformAction(userRole, action)) {
        return NextResponse.json(
          { error: `You do not have permission to ${action}` },
          { status: 403 }
        );
      }
    }

    // Permission granted
    return null;
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to wrap API routes with permission checks
 */
export function withPermissions(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  getOptions: (request: NextRequest, context: any) => PermissionCheckOptions | Promise<PermissionCheckOptions>
) {
  return async (request: NextRequest, context: any) => {
    const options = await getOptions(request, context);
    const permissionError = await checkPermission(request, options);

    if (permissionError) {
      return permissionError;
    }

    return handler(request, context);
  };
}

/**
 * Check if user is workspace owner
 */
export async function isWorkspaceOwner(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const role = await memberService.getUserRole(userId, workspaceId);
  return role === WorkspaceRole.OWNER;
}

/**
 * Check if user is workspace admin or owner
 */
export async function isWorkspaceAdmin(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const role = await memberService.getUserRole(userId, workspaceId);
  return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
}

/**
 * Require minimum role for route
 */
export function requireRole(role: WorkspaceRole) {
  return (workspaceId: string) => ({
    workspaceId,
    requiredRole: role,
  });
}

/**
 * Require specific action permission
 */
export function requireAction(action: string) {
  return (workspaceId: string) => ({
    workspaceId,
    action,
  });
}
