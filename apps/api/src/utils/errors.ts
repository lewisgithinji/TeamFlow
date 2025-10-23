/**
 * @file Custom error classes for the TeamFlow API.
 * @author Gemini Code Assist
 */

/**
 * Base class for all operational application errors.
 * Operational errors are known errors that we can handle gracefully (e.g., validation, not found).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Represents a 401 Unauthorized error.
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required and has failed or has not yet been provided.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Represents a 404 Not Found error.
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found.`, 404, 'NOT_FOUND');
  }
}

/**
 * Represents a 403 Forbidden error.
 * Used when a user is authenticated but lacks permission to access a resource.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}
