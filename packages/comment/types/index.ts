export interface CommentData {
  id: string;
  taskId: string;
  userId: string | null;
  content: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  replies?: CommentData[];
}

export interface CreateCommentInput {
  taskId: string;
  userId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  commentId: string;
  userId: string;
  content: string;
}

export interface DeleteCommentInput {
  commentId: string;
  userId: string;
}

export interface ListCommentsFilters {
  taskId: string;
  includeDeleted?: boolean;
  parentId?: string | null;
}

export interface CommentWithReplies extends CommentData {
  replies: CommentData[];
  replyCount: number;
}
