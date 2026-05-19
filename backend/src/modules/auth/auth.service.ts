import { Injectable } from '@nestjs/common';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { GoogleAuthUser } from './strategies/google.strategy';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { PasswordResetUseCase } from './use-cases/password.use-case';
import { SessionUseCase } from './use-cases/session.use-case';

// Pattern: Facade — exposes a stable API to controllers while use cases own business logic
@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly passwordResetUseCase: PasswordResetUseCase,
    private readonly sessionUseCase: SessionUseCase,
  ) {}

  register(dto: RegisterDto, remoteIp?: string) {
    return this.registerUseCase.register({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      locale: dto.locale,
      turnstileToken: dto.turnstileToken,
      remoteIp,
    });
  }

  verifyEmail(token: string) {
    return this.registerUseCase.verifyEmail(token);
  }

  resendVerification(email: string) {
    return this.registerUseCase.resendVerification(email);
  }

  login(dto: LoginDto, remoteIp?: string) {
    return this.loginUseCase.login({
      email: dto.email,
      password: dto.password,
      turnstileToken: dto.turnstileToken,
      remoteIp,
    });
  }

  loginWithGoogle(profile: GoogleAuthUser) {
    return this.loginUseCase.loginWithGoogle(profile);
  }

  forgotPassword(email: string, remoteIp?: string, turnstileToken?: string) {
    return this.passwordResetUseCase.forgotPassword({ email, remoteIp, turnstileToken });
  }

  resetPassword(
    token: string,
    newPassword: string,
    remoteIp?: string,
    turnstileToken?: string,
  ) {
    return this.passwordResetUseCase.resetPassword({
      token,
      newPassword,
      remoteIp,
      turnstileToken,
    });
  }

  getProfile(userId: string) {
    return this.sessionUseCase.getProfile(userId);
  }

  refreshToken(userId: string) {
    return this.sessionUseCase.refresh(userId);
  }

  logout(userId: string) {
    return this.sessionUseCase.logout(userId);
  }
}
