import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import type { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.types';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(
  req: Request<{}, {}, RegisterDto>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.registerUser(req.body);

    res.status(201).json({
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }
    }
    next(error);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(
  req: Request<{}, {}, LoginDto>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.loginUser(req.body);

    res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('Invalid email or password') ||
        error.message.includes('locked')
      ) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: error.message,
        });
      }
    }
    next(error);
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const user = await authService.getUserById(userId);

    res.status(200).json({
      data: user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export async function forgotPasswordHandler(
  req: Request<{}, {}, ForgotPasswordDto>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.forgotPassword(req.body);

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export async function resetPasswordHandler(
  req: Request<{}, {}, ResetPasswordDto>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.resetPassword(req.body);

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired') || error.message.includes('expired')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }
    }
    next(error);
  }
}

/**
 * Verify email with token
 * GET /api/auth/verify-email?token=xxx
 */
export async function verifyEmailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Verification token is required',
      });
    }

    const result = await authService.verifyEmail(token);

    res.status(200).json({
      message: result.message,
      data: { alreadyVerified: result.alreadyVerified },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid or expired')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
export async function resendVerificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email is required',
      });
    }

    const result = await authService.resendVerificationEmail(email);

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already verified')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
      });
    }
    next(error);
  }
}
