import { NextRequest, NextResponse } from 'next/server';
import { commentService, createCommentSchema, listCommentsSchema } from '@teamflow/comment';

/**
 * GET /api/tasks/[taskId]/comments - List comments for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Get user ID from request header (set by client)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    const queryParams = listCommentsSchema.parse({
      includeDeleted: searchParams.get('includeDeleted') === 'true',
      parentId: searchParams.get('parentId') || undefined,
    });

    const comments = await commentService.listComments({
      taskId: params.taskId,
      ...queryParams,
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('Failed to list comments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[taskId]/comments - Create a new comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Get user ID from request header (set by client)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse({
      ...body,
      taskId: params.taskId,
    });

    const comment = await commentService.createComment({
      taskId: params.taskId,
      userId: userId,
      content: validatedData.content,
      parentId: validatedData.parentId,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    );
  }
}
