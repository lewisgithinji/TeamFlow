import { NextRequest, NextResponse } from 'next/server';
import { commentService, updateCommentSchema } from '@teamflow/comment';

/**
 * GET /api/tasks/[taskId]/comments/[commentId] - Get a specific comment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string; commentId: string } }
) {
  try {
    // Get user ID from request header (set by client)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await commentService.getComment(params.commentId);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ comment }, { status: 200 });
  } catch (error) {
    console.error('Failed to get comment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get comment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[taskId]/comments/[commentId] - Update a comment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string; commentId: string } }
) {
  try {
    // Get user ID from request header (set by client)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    const comment = await commentService.updateComment({
      commentId: params.commentId,
      userId: userId,
      content: validatedData.content,
    });

    return NextResponse.json({ comment }, { status: 200 });
  } catch (error) {
    console.error('Failed to update comment:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('only edit your own')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[taskId]/comments/[commentId] - Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string; commentId: string } }
) {
  try {
    // Get user ID from request header (set by client)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await commentService.deleteComment({
      commentId: params.commentId,
      userId: userId,
    });

    return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete comment:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('only delete your own')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
