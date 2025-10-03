import { randomBytes } from 'crypto';

export function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function generateInvitationExpiry(days: number = 7): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
