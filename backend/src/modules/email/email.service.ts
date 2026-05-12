import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(
    private configService: ConfigService,
    private emailTemplateService: EmailTemplateService,
  ) {
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
      html: this.emailTemplateService.buildVerificationHtml(name, verifyUrl),
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
      html: this.emailTemplateService.buildResetPasswordHtml(name, resetUrl),
    });
  }
}
