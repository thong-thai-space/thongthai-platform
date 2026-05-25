import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../email/email.service';
import { AuthEmailNotifierPort } from '../domain/auth.email-notifier.port';

// Pattern: Adapter — bridges domain port to the EmailService implementation
@Injectable()
export class AuthEmailNotifierAdapter implements AuthEmailNotifierPort {
  private readonly logger = new Logger(AuthEmailNotifierAdapter.name);

  constructor(private readonly emailService: EmailService) {}

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    try {
      await this.emailService.sendVerificationEmail(email, name, token);
    } catch (error) {
      // Log but don't fail registration — the user can still request a resend.
      this.logger.error(
        `Failed to send verification email to ${email}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    try {
      await this.emailService.sendPasswordResetEmail(email, name, token);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
