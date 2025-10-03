import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService, createInvitationSchema, listInvitationsSchema } from '@teamflow/invitation';
import { WorkspaceRole } from '@teamflow/database';

/**
 * GET /api/invitations - List invitations for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Validate query params
    const params = listInvitationsSchema.parse({
      accepted: searchParams.get('accepted') === 'true' ? true : searchParams.get('accepted') === 'false' ? false : undefined,
      email: searchParams.get('email') || undefined,
    });

    // TODO: Verify user has permission to view invitations for this workspace

    const invitations = await invitationService.listInvitations({
      workspaceId,
      ...params,
    });

    return NextResponse.json({ invitations }, { status: 200 });
  } catch (error) {
    console.error('Failed to list invitations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations - Create a new invitation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Validate request body
    const validatedData = createInvitationSchema.parse(body);

    // TODO: Verify user has permission to invite members to this workspace

    const invitation = await invitationService.createInvitation({
      workspaceId,
      email: validatedData.email,
      role: validatedData.role,
      invitedBy: session.user.id,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Failed to create invitation:', error);

    if (error instanceof Error) {
      if (error.message.includes('already')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
