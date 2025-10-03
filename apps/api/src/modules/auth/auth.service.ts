import { prisma } from '@teamflow/database';
import { hashPassword, verifyPassword } from '../../utils/hash';
import { generateTokens } from '../../utils/jwt';
import type { RegisterDto, LoginDto, AuthResponse, ForgotPasswordDto, ResetPasswordDto } from './auth.types';
import { randomBytes } from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../../utils/email';

/**
 * Register a new user
 */
export async function registerUser(data: RegisterDto): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Generate email verification token
  const verificationToken = randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      provider: 'email',
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    },
  });

  // Send verification email (async, don't block registration)
  console.log(`📧 Sending verification email to ${user.email} with token: ${verificationToken.substring(0, 10)}...`);
  sendVerificationEmail(user.email, verificationToken, user.name)
    .then(() => {
      console.log(`✅ Verification email sent successfully to ${user.email}`);
    })
    .catch((error) => {
      console.error('❌ Failed to send verification email:', error);
    });

  // Generate tokens
  const tokens = generateTokens(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Login user
 */
export async function loginUser(data: LoginDto): Promise<AuthResponse> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 1000 / 60
    );
    throw new Error(`Account is locked. Try again in ${minutesLeft} minutes`);
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.passwordHash);

  if (!isValid) {
    // Increment failed login attempts
    const failedAttempts = user.failedLoginAttempts + 1;
    const updates: any = { failedLoginAttempts: failedAttempts };

    // Lock account after 5 failed attempts
    if (failedAttempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    throw new Error('Invalid email or password');
  }

  // Reset failed login attempts and update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  // Generate tokens
  const tokens = generateTokens(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Request password reset
 */
export async function forgotPassword(data: ForgotPasswordDto) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // Don't reveal if user exists (security best practice)
  if (!user) {
    return { message: 'If an account exists, a password reset link has been sent' };
  }

  // Generate reset token
  const resetToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save reset token
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt,
    },
  });

  // Send password reset email (async, don't block request)
  sendPasswordResetEmail(user.email, resetToken, user.name).catch((error) => {
    console.error('Failed to send password reset email:', error);
  });

  return { message: 'If an account exists, a password reset link has been sent' };
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordDto) {
  // Find valid reset token
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token: data.token },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.used) {
    throw new Error('Invalid or expired reset token');
  }

  // Check if token is expired
  if (resetRecord.expiresAt < new Date()) {
    throw new Error('Reset token has expired');
  }

  // Hash new password
  const passwordHash = await hashPassword(data.password);

  // Update user password
  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Mark token as used
  await prisma.passwordReset.update({
    where: { id: resetRecord.id },
    data: { used: true },
  });

  return { message: 'Password has been reset successfully' };
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string) {
  // Find user with this verification token
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: {
        gte: new Date(), // Token not expired
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  // Check if already verified
  if (user.emailVerified) {
    return { message: 'Email already verified', alreadyVerified: true };
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  // Send welcome email (async, don't block verification)
  sendWelcomeEmail(user.email, user.name).catch((error) => {
    console.error('Failed to send welcome email:', error);
  });

  return { message: 'Email verified successfully', alreadyVerified: false };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists
    return { message: 'If an account exists, a verification email has been sent' };
  }

  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  // Generate new token
  const verificationToken = randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update user with new token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    },
  });

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken, user.name);

  return { message: 'Verification email sent successfully' };
}
