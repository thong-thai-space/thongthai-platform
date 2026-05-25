import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import {
  AUTH_HASH_ROUNDS,
  AUTH_PASSWORD_HASHER,
  AUTH_TOKEN_TTL,
} from '../auth.constants';
import type { AuthPasswordHasherPort } from '../domain/auth.password-hasher.port';
import type { AuthTokenServicePort } from '../domain/auth.token-service.port';
import type { AuthTokens, ResetTokenPayload } from '../domain/auth.types';

// Pattern: Adapter — wraps @nestjs/jwt + config into a stable domain port
@Injectable()
export class JwtTokenServiceAdapter implements AuthTokenServicePort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(AUTH_PASSWORD_HASHER)
    private readonly hasher: AuthPasswordHasherPort,
  ) {}

  async generateSessionTokens(
    userId: string,
    role: string,
  ): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role },
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
          expiresIn: AUTH_TOKEN_TTL.ACCESS,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, role, type: 'refresh' },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: AUTH_TOKEN_TTL.REFRESH,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  generateResetPasswordToken(
    userId: string,
    passwordHash: string,
  ): Promise<string> {
    const secret =
      this.configService.get<string>('JWT_RESET_PASSWORD_SECRET') ||
      this.configService.getOrThrow<string>('JWT_SECRET');

    return this.jwtService.signAsync(
      {
        sub: userId,
        type: 'reset_password',
        fp: this.fingerprint(passwordHash),
      },
      { secret, expiresIn: AUTH_TOKEN_TTL.RESET_PASSWORD },
    );
  }

  async verifyResetPasswordToken(token: string): Promise<ResetTokenPayload> {
    const secret =
      this.configService.get<string>('JWT_RESET_PASSWORD_SECRET') ||
      this.configService.getOrThrow<string>('JWT_SECRET');

    return this.jwtService.verifyAsync<ResetTokenPayload>(token, { secret });
  }

  hashRefreshToken(refreshToken: string): Promise<string> {
    return this.hasher.hash(refreshToken, AUTH_HASH_ROUNDS.REFRESH_TOKEN);
  }

  private fingerprint(passwordHash: string): string {
    return createHash('sha256').update(passwordHash).digest('hex');
  }
}
