import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { memberService, listMembersSchema } from '@teamflow/workspace';
import { checkPermission } from '@/lib/middleware/permissions';
import { WorkspaceRole } from '@teamflow/database';

/**
 * GET /api/workspaces/[workspaceId]/members - List workspace members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    // Check permissions
    const permissionError = await checkPermission(request, {
      workspaceId: params.workspaceId,
      requiredRole: WorkspaceRole.VIEWER,
    });

    if (permissionError) {
      return permissionError;
    }

    const searchParams = request.nextUrl.searchParams;

    // Validate query params
    const queryParams = listMembersSchema.parse({
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const members = await memberService.listMembers({
      workspaceId: params.workspaceId,
      ...queryParams,
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error('Failed to list members:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list members' },
      { status: 500 }
    );
  }
}
