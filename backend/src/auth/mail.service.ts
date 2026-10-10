import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const maskedLocal =
    local.length > 2
      ? `${local[0]}***${local[local.length - 1]}`
      : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initResend();
  }

  private initResend(): Resend | null {
    const apiKey =
      this.configService.get<string>('RESEND_API_KEY') ||
      process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not configured in environment. Outgoing emails will be disabled.',
      );
      this.resend = null;
      return null;
    }

    if (!this.resend) {
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  /**
   * Diagnostic test method for Phase 5 to verify Resend delivery
   */
  async sendTestEmail(toEmail = 'delivered@resend.dev'): Promise<{
    success: boolean;
    emailId?: string;
    error?: string;
  }> {
    const client = this.initResend();
    if (!client) {
      return { success: false, error: 'RESEND_API_KEY is missing' };
    }

    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      process.env.RESEND_FROM_EMAIL ||
      'CloudRage <onboarding@resend.dev>';

    try {
      const { data, error } = await client.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: 'CloudRage Resend Test',
        html: '<p>CloudRage Resend integration test.</p>',
        text: 'CloudRage Resend integration test.',
      });

      if (error) {
        this.logger.error(
          `Resend test email error: [${error.name}] ${error.message}`,
        );
        return { success: false, error: error.message };
      }

      if (!data?.id) {
        this.logger.error('Resend test email failed: No email ID returned');
        return { success: false, error: 'No email ID returned' };
      }

      this.logger.log(`Resend test email sent successfully. ID: ${data.id}`);
      return { success: true, emailId: data.id };
    } catch (err: any) {
      this.logger.error(
        `Unexpected error sending Resend test email: ${err?.message}`,
      );
      return { success: false, error: err?.message };
    }
  }

  /**
   * Dispatches password reset email with secure token link
   */
  async sendPasswordResetEmail(
    toEmail: string,
    userName: string,
    resetToken: string,
  ): Promise<{ success: boolean; emailId?: string; error?: string }> {
    const client = this.initResend();
    if (!client) {
      this.logger.warn(
        `Password reset email for ${toEmail} was not dispatched: RESEND_API_KEY is not configured.`,
      );
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      process.env.RESEND_FROM_EMAIL ||
      'CloudRage <onboarding@resend.dev>';

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://cloud-file-storage-system-five.vercel.app'
        : 'http://localhost:3000');

    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your CloudRage Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            margin: 0;
            padding: 24px;
          }
          .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #111827;
            border-radius: 16px;
            border: 1px solid #1f2937;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            padding: 32px 32px;
            text-align: center;
          }
          .logo-text {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin: 0;
          }
          .subtitle {
            color: #93c5fd;
            font-size: 13px;
            margin-top: 4px;
            margin-bottom: 0;
          }
          .content {
            padding: 36px 32px;
          }
          .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #f8fafc;
          }
          .message {
            font-size: 14px;
            line-height: 1.6;
            color: #94a3b8;
            margin-bottom: 24px;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 13px 32px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.2px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
          }
          .url-fallback {
            font-size: 12px;
            color: #94a3b8;
            word-break: break-all;
            margin-top: 16px;
            padding: 12px 14px;
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            font-family: monospace;
          }
          .notice {
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #1f2937;
            margin-top: 28px;
            padding-top: 20px;
            line-height: 1.6;
          }
          .footer {
            background-color: #0b0f19;
            padding: 20px 32px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #1f2937;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo-text">CloudRage</h1>
            <p class="subtitle">Secure Cloud File Storage</p>
          </div>
          <div class="content">
            <p class="greeting">Hello ${userName || 'there'},</p>
            <p class="message">
              We received a request to reset the password for your CloudRage account.
              Click the button below to choose a new password:
            </p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
            </div>
            <p class="message" style="margin-bottom: 0; font-size: 13px;">
              If the button does not work, copy and paste this URL into your browser:
            </p>
            <div class="url-fallback">${resetUrl}</div>
            <div class="notice">
              <strong>Security Information:</strong><br>
              &bull; This link will expire in <strong>1 hour</strong> and can only be used once.<br>
              &bull; If you did not request this password reset, you can safely ignore this email. Your account remains secure.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} CloudRage. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `Hello ${userName || 'there'},

We received a request to reset the password for your CloudRage account.
Please visit the following URL to set a new password:
${resetUrl}

Security Notice:
- This password reset link will expire in 1 hour and can only be used once.
- If you did not request this password reset, you can safely ignore this email.

— The CloudRage Team`;

    const recipientMasked = maskEmail(toEmail);
    const normalizedTo = toEmail.trim().toLowerCase();

    try {
      this.logger.log(`Dispatching password reset email via Resend to ${recipientMasked}`);
      const { data, error } = await client.emails.send({
        from: fromEmail,
        to: [normalizedTo],
        subject: 'Reset Your CloudRage Password',
        html: emailHtml,
        text: emailText,
      });

      if (error) {
        if (
          error.name === 'validation_error' &&
          error.message?.includes('only send testing emails')
        ) {
          this.logger.warn(
            `[Resend Sandbox Restriction] Resend sandbox sender (${fromEmail}) only permits delivery to account owner and delivered@resend.dev. To deliver to ${recipientMasked}, a verified domain is required in resend.com/domains.`,
          );
        } else {
          this.logger.error(
            `Resend API error sending password reset email to ${recipientMasked}: [${error.name}] ${error.message}`,
          );
        }
        return { success: false, error: error.message };
      }

      if (!data?.id) {
        this.logger.error(
          `Resend did not return an email ID for ${recipientMasked}`,
        );
        return { success: false, error: 'No email ID returned by Resend' };
      }

      this.logger.log(
        `Password reset email successfully accepted by Resend for ${recipientMasked}. Resend Email ID: ${data.id}`,
      );
      return { success: true, emailId: data.id };
    } catch (err: any) {
      this.logger.error(
        `Exception occurred while sending password reset email to ${recipientMasked}: ${err?.message}`,
      );
      return { success: false, error: err?.message };
    }
  }
}
