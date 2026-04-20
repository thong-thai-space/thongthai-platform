import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'noreply@thongthaispace.com';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — email sending is disabled');
    }
  }

  async sendVerificationEmail(to: string, name: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    if (!this.resend) {
      this.logger.log(`[DEV] Verification link for ${to}: ${verifyUrl}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Verify your Thong Thai Space email',
      html: this.buildVerificationHtml(name, verifyUrl),
    });
  }

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    if (!this.resend) {
      this.logger.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Reset your Thong Thai Space password',
      html: this.buildResetPasswordHtml(name, resetUrl),
    });
  }

  private buildVerificationHtml(name: string, verifyUrl: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:#18181b;padding:24px 32px;text-align:center">
            <span style="color:#ffffff;font-size:20px;font-weight:700">&#9889; Thong Thai Space</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px">
            <h2 style="margin:0 0 12px;color:#18181b;font-size:22px">Verify your email address</h2>
            <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6">
              Hi ${name},<br><br>
              Thanks for signing up! Click the button below to verify your email and activate your account.
            </p>
            <div style="text-align:center;margin-bottom:28px">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600">
                Verify Email
              </a>
            </div>
            <p style="margin:0 0 8px;color:#71717a;font-size:13px">
              This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
            </p>
            <p style="margin:0;color:#a1a1aa;font-size:12px;word-break:break-all">
              Or copy this link: ${verifyUrl}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f4f4f5;text-align:center">
            <p style="margin:0;color:#a1a1aa;font-size:12px">
              &copy; ${year} Thong Thai Space. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildResetPasswordHtml(name: string, resetUrl: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:#18181b;padding:24px 32px;text-align:center">
            <span style="color:#ffffff;font-size:20px;font-weight:700">&#9889; Thong Thai Space</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px">
            <h2 style="margin:0 0 12px;color:#18181b;font-size:22px">Reset your password</h2>
            <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6">
              Hi ${name},<br><br>
              We received a request to reset your password. Click the button below to choose a new password.
            </p>
            <div style="text-align:center;margin-bottom:28px">
              <a href="${resetUrl}"
                 style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600">
                Reset Password
              </a>
            </div>
            <p style="margin:0 0 8px;color:#71717a;font-size:13px">
              This link expires in <strong>30 minutes</strong>. If you didn't request this, you can ignore this email.
            </p>
            <p style="margin:0;color:#a1a1aa;font-size:12px;word-break:break-all">
              Or copy this link: ${resetUrl}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f4f4f5;text-align:center">
            <p style="margin:0;color:#a1a1aa;font-size:12px">
              &copy; ${year} Thong Thai Space. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
