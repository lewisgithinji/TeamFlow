import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService, resendInvitationSchema } from '@teamflow/invitation';

/**
 * POST /api/invitations/[invitationId]/resend - Resend an invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
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

    const validatedData = resendInvitationSchema.parse({
      invitationId: params.invitationId,
    });

    // TODO: Verify user has permission to resend invitations for this workspace

    const invitation = await invitationService.resendInvitation({
      invitationId: validatedData.invitationId,
      workspaceId,
    });

    return NextResponse.json({ invitation }, { status: 200 });
  } catch (error) {
    console.error('Failed to resend invitation:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('accepted')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}
