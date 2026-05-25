import { Inject, Injectable, Logger } from '@nestjs/common';
import { AUTH_REPOSITORY, AUTH_TOKEN_SERVICE } from '../auth.constants';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import type { AuthTokenServicePort } from '../domain/auth.token-service.port';
import type { AuthTokens, AuthUser, AuthSession } from '../domain/auth.types';
import { stripPassword } from './auth.mapper';

// Pattern: Application Service — single place that issues + persists session tokens
@Injectable()
export class SessionIssuer {
  private readonly logger = new Logger(SessionIssuer.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepositoryPort,
    @Inject(AUTH_TOKEN_SERVICE) private readonly tokens: AuthTokenServicePort,
  ) {}

  async issueFor(user: Pick<AuthUser, 'id' | 'role'>): Promise<AuthTokens> {
    const pair = await this.tokens.generateSessionTokens(user.id, user.role);
    const refreshTokenHash = await this.tokens.hashRefreshToken(
      pair.refreshToken,
    );

    try {
      await this.repo.update(user.id, { refreshTokenHash });
    } catch (error) {
      // Refresh-token rotation requires the column to exist; log so the gap is visible.
      this.logger.warn(
        `Could not persist refreshTokenHash for user ${user.id} — rotation may be impaired. Cause: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }

    return pair;
  }

  async sessionFor(user: AuthUser): Promise<AuthSession> {
    const tokens = await this.issueFor(user);
    return { user: stripPassword(user), ...tokens };
  }
}
