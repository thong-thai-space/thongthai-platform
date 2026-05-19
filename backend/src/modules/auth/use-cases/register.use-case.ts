import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  AUTH_EMAIL_NOTIFIER,
  AUTH_REPOSITORY,
  AUTH_TOKEN_TTL,
} from '../auth.constants';
import type { AuthEmailNotifierPort } from '../domain/auth.email-notifier.port';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import type {
  AuthSession,
  RegisterCommand,
} from '../domain/auth.types';
import { PasswordPolicy } from '../policies/password.policy';
import { SecurityChallengePolicy } from '../policies/security-challenge.policy';
import { SessionIssuer } from './session-issuer.service';

// Pattern: Use Case — owns the registration + verification flow
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepositoryPort,
    @Inject(AUTH_EMAIL_NOTIFIER) private readonly notifier: AuthEmailNotifierPort,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly challengePolicy: SecurityChallengePolicy,
    private readonly sessionIssuer: SessionIssuer,
  ) {}

  async register(cmd: RegisterCommand): Promise<{ message: string }> {
    await this.challengePolicy.enforce(cmd.turnstileToken, cmd.remoteIp);
    this.passwordPolicy.assertStrong(cmd.password);

    const existing = await this.repo.findByEmail(cmd.email);
    const { token, expiresAt } = this.newVerificationToken();
    const hashedPassword = await this.passwordPolicy.hash(cmd.password);

    if (existing) {
      // Protect verified or OAuth-linked accounts from being overwritten.
      if (existing.emailVerified || existing.googleId) {
        throw new ConflictException('Email already registered');
      }

      await this.repo.update(existing.id, {
        name: cmd.name,
        phone: cmd.phone,
        role: cmd.role,
        locale: cmd.locale,
        password: hashedPassword,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        emailVerifyToken: token,
        emailVerifyTokenExpiry: expiresAt,
        isActive: true,
      });

      await this.notifier.sendVerificationEmail(cmd.email, cmd.name, token);
      return {
        message:
          'Your account is pending verification. We sent a new verification email.',
      };
    }

    await this.repo.create({
      email: cmd.email,
      name: cmd.name,
      phone: cmd.phone,
      role: cmd.role,
      locale: cmd.locale,
      password: hashedPassword,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      emailVerified: false,
      emailVerifyToken: token,
      emailVerifyTokenExpiry: expiresAt,
    });

    await this.notifier.sendVerificationEmail(cmd.email, cmd.name, token);
    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string): Promise<AuthSession> {
    const user = await this.repo.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Invalid verification link');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    if (!user.emailVerifyTokenExpiry || user.emailVerifyTokenExpiry < new Date()) {
      throw new BadRequestException(
        'Verification link has expired. Please request a new one.',
      );
    }

    const updated = await this.repo.update(user.id, {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyTokenExpiry: null,
      lastLoginAt: new Date(),
    });

    const fresh = await this.repo.findById(updated.id);
    if (!fresh) throw new BadRequestException('Invalid verification link');
    return this.sessionIssuer.sessionFor(fresh);
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const genericMessage =
      'If that email is registered and unverified, a new link has been sent.';

    const user = await this.repo.findByEmail(email);
    if (!user || user.emailVerified) {
      return { message: genericMessage };
    }

    const { token, expiresAt } = this.newVerificationToken();
    await this.repo.update(user.id, {
      emailVerifyToken: token,
      emailVerifyTokenExpiry: expiresAt,
    });

    await this.notifier.sendVerificationEmail(user.email, user.name, token);
    return { message: genericMessage };
  }

  private newVerificationToken() {
    return {
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + AUTH_TOKEN_TTL.EMAIL_VERIFICATION_MS),
    };
  }
}
