import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { memberService, updateMemberRoleSchema, removeMemberSchema } from '@teamflow/workspace';
import { checkPermission } from '@/lib/middleware/permissions';
import { WorkspaceRole } from '@teamflow/database';

/**
 * PATCH /api/workspaces/[workspaceId]/members/[memberId] - Update member role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const permissionError = await checkPermission(request, {
      workspaceId: params.workspaceId,
      action: 'member:update_role',
    });

    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const validatedData = updateMemberRoleSchema.parse(body);

    const updatedMember = await memberService.updateMemberRole({
      workspaceId: params.workspaceId,
      memberId: params.memberId,
      newRole: validatedData.newRole,
      updatedBy: session.user.id,
    });

    return NextResponse.json({ member: updatedMember }, { status: 200 });
  } catch (error) {
    console.error('Failed to update member role:', error);

    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/members/[memberId] - Remove member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const permissionError = await checkPermission(request, {
      workspaceId: params.workspaceId,
      action: 'member:remove',
    });

    if (permissionError) {
      return permissionError;
    }

    await memberService.removeMember({
      workspaceId: params.workspaceId,
      memberId: params.memberId,
      removedBy: session.user.id,
    });

    return NextResponse.json({ message: 'Member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to remove member:', error);

    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 }
    );
  }
}
