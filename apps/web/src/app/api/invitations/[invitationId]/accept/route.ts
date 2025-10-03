import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService, acceptInvitationSchema } from '@teamflow/invitation';

/**
 * POST /api/invitations/[invitationId]/accept - Accept an invitation
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
    const validatedData = acceptInvitationSchema.parse(body);

    await invitationService.acceptInvitation({
      token: validatedData.token,
      userId: session.user.id,
    });

    return NextResponse.json({ message: 'Invitation accepted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to accept invitation:', error);

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return NextResponse.json({ error: error.message }, { status: 410 });
      }
      if (error.message.includes('already')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
