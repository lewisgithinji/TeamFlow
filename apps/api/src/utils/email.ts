import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'TeamFlow <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendVerificationEmail = async (to: string, token: string, name: string): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - TeamFlow</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">Welcome to TeamFlow!</h1>
                    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #52525b;">
                      Thanks for signing up! Please verify your email address to get started.
                    </p>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #52525b;">
                      Click the button below to verify your email:
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius: 6px; background-color: #3b82f6;">
                          <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                            Verify Email
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 32px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                      Or copy and paste this link in your browser:<br>
                      <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: underline;">${verificationUrl}</a>
                    </p>
                    <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                      This link will expire in 24 hours.
                    </p>
                    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                      If you didn't create an account with TeamFlow, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Verify your email - TeamFlow',
    html,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string, name: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - TeamFlow</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">Reset Your Password</h1>
                    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #52525b;">
                      We received a request to reset your password for your TeamFlow account.
                    </p>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #52525b;">
                      Click the button below to reset your password:
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius: 6px; background-color: #3b82f6;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 32px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                      Or copy and paste this link in your browser:<br>
                      <a href="${resetUrl}" style="color: #3b82f6; text-decoration: underline;">${resetUrl}</a>
                    </p>
                    <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                      This link will expire in 1 hour.
                    </p>
                    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Reset your password - TeamFlow',
    html,
  });
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TeamFlow</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">Welcome to TeamFlow, ${name}!</h1>
                    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #52525b;">
                      Your email has been verified successfully! You're all set to start collaborating with your team.
                    </p>
                    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #52525b;">
                      Here's what you can do next:
                    </p>
                    <ul style="margin: 0 0 32px; padding-left: 20px; font-size: 16px; line-height: 28px; color: #52525b;">
                      <li>Create your first workspace</li>
                      <li>Invite team members</li>
                      <li>Start managing projects and tasks</li>
                    </ul>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius: 6px; background-color: #3b82f6;">
                          <a href="${process.env.FRONTEND_URL}/dashboard" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                      Need help getting started? Check out our documentation or reach out to our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Welcome to TeamFlow!',
    html,
  });
};
