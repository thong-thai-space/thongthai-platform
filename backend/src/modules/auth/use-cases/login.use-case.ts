import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AUTH_REPOSITORY } from '../auth.constants';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import type {
  AuthSession,
  GoogleProfile,
  LoginCommand,
} from '../domain/auth.types';
import { PasswordPolicy } from '../policies/password.policy';
import { SecurityChallengePolicy } from '../policies/security-challenge.policy';
import { SessionIssuer } from './session-issuer.service';

// Pattern: Use Case — owns email/password + Google OAuth login flows
@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepositoryPort,
    private readonly passwordPolicy: PasswordPolicy,
    private readonly challengePolicy: SecurityChallengePolicy,
    private readonly sessionIssuer: SessionIssuer,
  ) {}

  async login(cmd: LoginCommand): Promise<AuthSession> {
    await this.challengePolicy.enforce(cmd.turnstileToken, cmd.remoteIp);

    const user = await this.repo.findByEmail(cmd.email);
    if (!user || !user.isActive || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await this.passwordPolicy.compare(cmd.password, user.password);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerified && !user.googleId) {
      throw new UnauthorizedException(
        'Please verify your email before signing in.',
      );
    }

    return this.sessionIssuer.sessionFor(user);
  }

  async loginWithGoogle(profile: GoogleProfile): Promise<AuthSession> {
    const existing = await this.repo.findByEmail(profile.email);
    const user = existing
      ? await this.syncGoogleProfile(existing.id, existing, profile)
      : await this.createFromGoogle(profile);

    return this.sessionIssuer.sessionFor(user);
  }

  private async createFromGoogle(profile: GoogleProfile) {
    const placeholderPassword = await this.passwordPolicy.hash(
      randomBytes(24).toString('hex'),
    );

    try {
      const created = await this.repo.create({
        email: profile.email,
        name: profile.name,
        password: placeholderPassword,
        googleId: profile.googleId,
        avatar: profile.avatar,
        emailVerified: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        isActive: true,
      });
      const fresh = await this.repo.findById(created.id);
      if (!fresh) throw new UnauthorizedException('Failed to load user');
      return fresh;
    } catch (error) {
      if (!isMissingColumnError(error)) throw error;
      this.logger.warn(
        'Outdated DB schema during Google signup — falling back to minimal fields. Run latest Prisma migrations.',
      );
      const created = await this.repo.create({
        email: profile.email,
        name: profile.name,
        password: placeholderPassword,
        isActive: true,
      });
      const fresh = await this.repo.findById(created.id);
      if (!fresh) throw new UnauthorizedException('Failed to load user');
      return fresh;
    }
  }

  private async syncGoogleProfile(
    userId: string,
    existing: { googleId: string | null; name: string | null; avatar: string | null },
    profile: GoogleProfile,
  ) {
    try {
      await this.repo.update(userId, {
        googleId: existing.googleId || profile.googleId,
        name: existing.name || profile.name,
        avatar: existing.avatar || profile.avatar,
        emailVerified: true,
        isActive: true,
        lastLoginAt: new Date(),
      });
    } catch (error) {
      if (!isMissingColumnError(error)) throw error;
      this.logger.warn(
        'Outdated DB schema during Google login — skipping profile sync. Run latest Prisma migrations.',
      );
    }

    const fresh = await this.repo.findById(userId);
    if (!fresh) throw new UnauthorizedException('Failed to load user');
    return fresh;
  }
}

function isMissingColumnError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('does not exist in the current database') ||
    message.includes('column')
  );
}
