import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@teamflow/invitation';

/**
 * GET /api/invitations/verify?token=xxx - Verify an invitation token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.accepted) {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 410 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    return NextResponse.json({ invitation }, { status: 200 });
  } catch (error) {
    console.error('Failed to verify invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}
