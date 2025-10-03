export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface EmailConfig {
  apiKey: string;
  from: string;
  replyTo?: string;
}

export type EmailTemplate =
  | 'workspace-invitation'
  | 'password-reset'
  | 'verify-email'
  | 'task-assigned'
  | 'task-due-soon'
  | 'mention'
  | 'comment-reply';
