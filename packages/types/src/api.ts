// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  workspaceId?: string;
  iat: number;
  exp: number;
}

// Auth Response
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}
