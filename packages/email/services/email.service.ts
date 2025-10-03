import { Resend } from 'resend';
import { EmailOptions, EmailConfig } from '../types';
import { WorkspaceInvitationEmail } from '../templates/WorkspaceInvitationEmail';
import { PasswordResetEmail } from '../templates/PasswordResetEmail';
import { VerifyEmailEmail } from '../templates/VerifyEmailEmail';

export class EmailService {
  private resend: Resend;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    this.config = config || {
      apiKey: process.env.EMAIL_API_KEY || '',
      from: process.env.EMAIL_FROM || 'TeamFlow <noreply@teamflow.dev>',
      replyTo: process.env.EMAIL_REPLY_TO,
    };

    if (!this.config.apiKey) {
      console.warn('Email API key not configured. Emails will not be sent.');
    }

    this.resend = new Resend(this.config.apiKey);
  }

  /**
   * Send an email using a template
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (!this.config.apiKey) {
        console.log('[Email Mock] Would send email:', {
          to: options.to,
          subject: options.subject,
          template: options.template,
        });
        return;
      }

      const template = this.getTemplate(options.template, options.data);

      const result = await this.resend.emails.send({
        from: this.config.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        react: template,
        replyTo: this.config.replyTo,
      });

      if (result.error) {
        throw new Error(`Failed to send email: ${result.error.message}`);
      }

      console.log('[Email] Sent successfully:', result.data?.id);
    } catch (error) {
      console.error('[Email] Failed to send:', error);
      throw error;
    }
  }

  /**
   * Get the template component for the given template name
   */
  private getTemplate(template: string, data: Record<string, any>): React.ReactElement {
    switch (template) {
      case 'workspace-invitation':
        return WorkspaceInvitationEmail(data);
      case 'password-reset':
        return PasswordResetEmail(data);
      case 'verify-email':
        return VerifyEmailEmail(data);
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }
}

// Singleton instance
export const emailService = new EmailService();

// Export convenience function
export async function sendEmail(options: EmailOptions): Promise<void> {
  return emailService.sendEmail(options);
}
