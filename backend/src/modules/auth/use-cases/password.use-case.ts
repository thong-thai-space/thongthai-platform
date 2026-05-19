import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AUTH_EMAIL_NOTIFIER,
  AUTH_REPOSITORY,
  AUTH_TOKEN_SERVICE,
} from '../auth.constants';
import type { AuthEmailNotifierPort } from '../domain/auth.email-notifier.port';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import type { AuthTokenServicePort } from '../domain/auth.token-service.port';
import type {
  ForgotPasswordCommand,
  ResetPasswordCommand,
} from '../domain/auth.types';
import { PasswordPolicy } from '../policies/password.policy';
import { SecurityChallengePolicy } from '../policies/security-challenge.policy';

const GENERIC_MESSAGE =
  'If that email is registered, you will receive password reset instructions shortly.';

// Pattern: Use Case — owns forgot/reset password flows
@Injectable()
export class PasswordResetUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepositoryPort,
    @Inject(AUTH_EMAIL_NOTIFIER) private readonly notifier: AuthEmailNotifierPort,
    @Inject(AUTH_TOKEN_SERVICE) private readonly tokens: AuthTokenServicePort,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly challengePolicy: SecurityChallengePolicy,
  ) {}

  async forgotPassword(cmd: ForgotPasswordCommand): Promise<{ message: string }> {
    await this.challengePolicy.enforce(cmd.turnstileToken, cmd.remoteIp);

    const user = await this.repo.findByEmail(cmd.email);
    if (!user || !user.isActive || !user.password) {
      return { message: GENERIC_MESSAGE };
    }

    const resetToken = await this.tokens.generateResetPasswordToken(
      user.id,
      user.password,
    );
    await this.notifier.sendPasswordResetEmail(user.email, user.name, resetToken);
    return { message: GENERIC_MESSAGE };
  }

  async resetPassword(cmd: ResetPasswordCommand): Promise<{ message: string }> {
    await this.challengePolicy.enforce(cmd.turnstileToken, cmd.remoteIp);
    this.passwordPolicy.assertStrong(cmd.newPassword);

    const payload = await this.parseToken(cmd.token);
    const user = await this.repo.findById(payload.sub);
    if (!user || !user.isActive || !user.password) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    if (fingerprint(user.password) !== payload.fp) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    const hashedPassword = await this.passwordPolicy.hash(cmd.newPassword);
    await this.repo.update(user.id, {
      password: hashedPassword,
      refreshTokenHash: null,
      lastLoginAt: new Date(),
    });

    return {
      message:
        'Password has been reset successfully. Please sign in with your new password.',
    };
  }

  private async parseToken(token: string) {
    try {
      const payload = await this.tokens.verifyResetPasswordToken(token);
      if (!payload?.sub || payload.type !== 'reset_password' || !payload.fp) {
        throw new BadRequestException('Reset link is invalid or expired');
      }
      return payload;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Reset link is invalid or expired');
    }
  }
}

function fingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex');
}
