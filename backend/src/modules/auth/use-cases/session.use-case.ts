import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../auth.constants';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import type { AuthTokens, PublicAuthUser } from '../domain/auth.types';
import { stripPassword } from './auth.mapper';
import { SessionIssuer } from './session-issuer.service';

// Pattern: Use Case — session lifecycle: profile, refresh, logout
@Injectable()
export class SessionUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepositoryPort,
    private readonly sessionIssuer: SessionIssuer,
  ) {}

  async getProfile(userId: string): Promise<PublicAuthUser> {
    const user = await this.repo.findById(userId);
    if (!user || !user.isActive) throw new UnauthorizedException();
    return stripPassword(user);
  }

  async refresh(userId: string): Promise<AuthTokens> {
    const user = await this.repo.findById(userId);
    if (!user || !user.isActive) throw new UnauthorizedException();
    return this.sessionIssuer.issueFor(user);
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.repo.update(userId, { refreshTokenHash: null });
    return { message: 'Logged out successfully' };
  }
}
