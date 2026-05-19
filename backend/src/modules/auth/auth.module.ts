import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '../email/email.module';
import { TurnstileService } from '../../common/turnstile/turnstile.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AUTH_EMAIL_NOTIFIER,
  AUTH_PASSWORD_HASHER,
  AUTH_REPOSITORY,
  AUTH_SECURITY_CHALLENGE,
  AUTH_TOKEN_SERVICE,
} from './auth.constants';
import { AuthEmailNotifierAdapter } from './adapters/auth-email-notifier.adapter';
import { BcryptPasswordHasherAdapter } from './adapters/bcrypt-password-hasher.adapter';
import { JwtTokenServiceAdapter } from './adapters/jwt-token-service.adapter';
import { TurnstileSecurityChallengeAdapter } from './adapters/turnstile-security-challenge.adapter';
import { AuthRepository } from './repositories/auth.repository';
import { PasswordPolicy } from './policies/password.policy';
import { SecurityChallengePolicy } from './policies/security-challenge.policy';
import { SessionIssuer } from './use-cases/session-issuer.service';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { PasswordResetUseCase } from './use-cases/password.use-case';
import { SessionUseCase } from './use-cases/session.use-case';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { RolesGuard } from './guards/roles.guard';

// Pattern: Composition Root — wires ports to adapters once, using DI symbols
@Module({
  imports: [PassportModule, JwtModule.register({}), EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,

    // Concrete adapters
    AuthRepository,
    AuthEmailNotifierAdapter,
    BcryptPasswordHasherAdapter,
    JwtTokenServiceAdapter,
    TurnstileSecurityChallengeAdapter,
    TurnstileService,

    // Port bindings (Dependency Inversion)
    { provide: AUTH_REPOSITORY, useExisting: AuthRepository },
    { provide: AUTH_EMAIL_NOTIFIER, useExisting: AuthEmailNotifierAdapter },
    { provide: AUTH_PASSWORD_HASHER, useExisting: BcryptPasswordHasherAdapter },
    { provide: AUTH_TOKEN_SERVICE, useExisting: JwtTokenServiceAdapter },
    { provide: AUTH_SECURITY_CHALLENGE, useExisting: TurnstileSecurityChallengeAdapter },

    // Policies
    PasswordPolicy,
    SecurityChallengePolicy,

    // Use cases
    SessionIssuer,
    RegisterUseCase,
    LoginUseCase,
    PasswordResetUseCase,
    SessionUseCase,

    // Auth strategies + guards
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    RolesGuard,
  ],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
