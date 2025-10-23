import { Resend } from 'resend';
import { NotificationType } from '@teamflow/database';
import { logger } from '../utils/logger';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.FROM_EMAIL || 'TeamFlow <noreply@teamflow.dev>';
const webUrl = process.env.WEB_URL || 'http://localhost:3001';

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!resend) {
    logger.info(`--- 📧 DEV MODE: Email would be sent to ${to} ---`);
    logger.info(`From: ${fromEmail}`);
    logger.info(`Subject: ${subject}`);
    logger.info('Body (HTML):');
    console.log(html); // Use console.log to print raw HTML for readability
    logger.info('---------------------------------');
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: subject,
      html,
    });
    logger.info(`Email sent to ${to} with subject "${subject}"`);
  } catch (error) {
    logger.error('Failed to send email via Resend', {
      error,
      recipient: to,
      subject,
    });
  }
};

/**
 * Sends a welcome email to a new user.
 * @param userEmail - The recipient's email address.
 * @param userName - The recipient's name.
 */
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const subject = '🎉 Welcome to TeamFlow!';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h1 style="color: #4A90E2;">Welcome to TeamFlow, ${userName}!</h1>
      <p>We're thrilled to have you on board. TeamFlow is designed to make your project management seamless and intelligent.</p>
      <p>Here are a few things you can do to get started:</p>
      <ul>
        <li>Create your first workspace and project.</li>
        <li>Invite your team members to collaborate.</li>
        <li>Start creating tasks and organizing your work on the Kanban board.</li>
      </ul>
      <a href="${webUrl}/dashboard" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 5px;">Go to Your Dashboard</a>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">Welcome aboard,<br/>The TeamFlow Team</p>
    </div>
  `;
  await sendEmail(userEmail, subject, html);
}

/**
 * Sends an email verification email.
 * @param userEmail - The recipient's email address.
 * @param token - The verification token.
 * @param userName - The recipient's name.
 */
export async function sendVerificationEmail(userEmail: string, token: string, userName: string) {
  const verificationUrl = `${webUrl}/verify-email?token=${token}`;
  const subject = 'Verify Your Email Address for TeamFlow';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #4A90E2;">One last step, ${userName}!</h1>
      <p>Please verify your email address to complete your registration and secure your account.</p>
      <a href="${verificationUrl}" style="display: inline-block; margin: 20px 0; padding: 10px 20px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email Address</a>
      <p style="font-size: 12px; color: #999;">This link will expire in 24 hours.</p>
    </div>
  `;
  await sendEmail(userEmail, subject, html);
}

/**
 * Sends a password reset email.
 * @param userEmail - The recipient's email address.
 * @param token - The password reset token.
 * @param userName - The recipient's name.
 */
export async function sendPasswordResetEmail(userEmail: string, token: string, userName: string) {
  const resetUrl = `${webUrl}/reset-password?token=${token}`;
  const subject = 'Your TeamFlow Password Reset Request';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #4A90E2;">Reset Your Password</h1>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 10px 20px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p style="font-size: 12px; color: #999;">This link will expire in 1 hour.</p>
    </div>
  `;
  await sendEmail(userEmail, subject, html);
}

interface NotificationEmailPayload {
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  userEmail: string;
  userName: string;
}

/**
 * Sends a notification email based on the notification type.
 * @param type - The type of the notification.
 * @param payload - The data for the email.
 */
export async function sendNotificationEmail(
  type: NotificationType,
  payload: NotificationEmailPayload
) {
  let subject = '';
  let htmlBody = '';

  switch (type) {
    case 'TASK_ASSIGNED':
      subject = payload.title;
      htmlBody = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #4A90E2;">${payload.title}</h1>
          <p>Hi ${payload.userName},</p>
          <p>${payload.message}</p>
          <a href="${webUrl}${payload.linkUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 5px;">View Task</a>
          <p style="font-size: 12px; color: #999;">You are receiving this because you have email notifications enabled for task assignments.</p>
        </div>
      `;
      break;
    case 'MENTION':
      subject = payload.title;
      htmlBody = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #4A90E2;">${payload.title}</h1>
          <p>Hi ${payload.userName},</p>
          <p>${payload.message}</p>
          <a href="${webUrl}${payload.linkUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 5px;">View Comment</a>
          <p style="font-size: 12px; color: #999;">You are receiving this because you have email notifications enabled for mentions.</p>
        </div>
      `;
      break;
    default:
      logger.warn(`Email template not found for notification type: ${type}`);
      return;
  }

  await sendEmail(payload.userEmail, subject, htmlBody);
}
