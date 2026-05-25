import type { AuthTokens, ResetTokenPayload } from './auth.types';

// Pattern: Output Port — abstracts token signing/verification
export interface AuthTokenServicePort {
  generateSessionTokens(userId: string, role: string): Promise<AuthTokens>;
  generateResetPasswordToken(
    userId: string,
    passwordHash: string,
  ): Promise<string>;
  verifyResetPasswordToken(token: string): Promise<ResetTokenPayload>;
  hashRefreshToken(refreshToken: string): Promise<string>;
}
