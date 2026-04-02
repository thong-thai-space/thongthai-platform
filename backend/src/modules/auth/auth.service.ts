import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { AuthRepository } from './repositories/auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { GoogleAuthUser } from './strategies/google.strategy';
import { TurnstileService } from '../../common/turnstile/turnstile.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private turnstileService: TurnstileService,
  ) {}

  private isMissingColumnError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes('does not exist in the current database') ||
      message.includes('column')
    );
  }

  private async ensureTurnstile(
    token: string | undefined,
    remoteIp?: string,
  ): Promise<void> {
    if (!this.turnstileService.isEnabled()) {
      return;
    }

    if (!token) {
      throw new BadRequestException('Please complete the security challenge');
    }

    const isValid = await this.turnstileService.verifyToken(token, remoteIp);
    if (!isValid) {
      throw new UnauthorizedException('Security challenge validation failed');
    }
  }

  async register(dto: RegisterDto, remoteIp?: string) {
    await this.ensureTurnstile(dto.turnstileToken, remoteIp);

    const existing = await this.authRepository.findByEmail(dto.email);
    const verifyToken = randomBytes(32).toString('hex');
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    if (existing) {
      // Keep verified users and Google users protected from account overwrite.
      if (existing.emailVerified || existing.googleId) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12);
      await this.authRepository.update(existing.id, {
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
        locale: dto.locale,
        password: hashedPassword,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        emailVerifyToken: verifyToken,
        emailVerifyTokenExpiry: verifyExpiry,
        isActive: true,
      });

      await this.emailService.sendVerificationEmail(
        dto.email,
        dto.name,
        verifyToken,
      );

      return {
        message:
          'Your account is pending verification. We sent a new verification email.',
      };
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.authRepository.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      locale: dto.locale,
      password: hashedPassword,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      emailVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyTokenExpiry: verifyExpiry,
    });

    await this.emailService.sendVerificationEmail(dto.email, dto.name, verifyToken);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await this.authRepository.findByVerificationToken(token);

    if (!user) throw new BadRequestException('Invalid verification link');
    if (user.emailVerified) throw new BadRequestException('Email already verified');
    if (!user.emailVerifyTokenExpiry || user.emailVerifyTokenExpiry < new Date()) {
      throw new BadRequestException('Verification link has expired. Please request a new one.');
    }

    const updated = await this.authRepository.update(user.id, {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyTokenExpiry: null,
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(updated.id, updated.role);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updated;
    return { user: userWithoutPassword, ...tokens };
  }

  async resendVerification(email: string) {
    const user = await this.authRepository.findByEmail(email);

    if (!user || user.emailVerified) {
      // Return generic message to avoid exposing whether email exists
      return { message: 'If that email is registered and unverified, a new link has been sent.' };
    }

    const verifyToken = randomBytes(32).toString('hex');
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.authRepository.update(user.id, {
      emailVerifyToken: verifyToken,
      emailVerifyTokenExpiry: verifyExpiry,
    });

    await this.emailService.sendVerificationEmail(user.email, user.name, verifyToken);

    return { message: 'If that email is registered and unverified, a new link has been sent.' };
  }

  async login(dto: LoginDto, remoteIp?: string) {
    await this.ensureTurnstile(dto.turnstileToken, remoteIp);

    const user = await this.authRepository.findByEmail(dto.email);
    if (!user || !user.isActive)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.password || typeof user.password !== 'string') {
      throw new UnauthorizedException('Invalid credentials');
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(dto.password, user.password);
    } catch {
      // Handles corrupted or non-bcrypt hashes without leaking internals.
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Block login for email/password users who haven't verified
    if (!user.emailVerified && !user.googleId) {
      throw new UnauthorizedException('Please verify your email before signing in.');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async loginWithGoogle(googleUser: GoogleAuthUser) {
    const existing = await this.authRepository.findByEmail(googleUser.email);

    let user = existing;

    if (!user) {
      const placeholderPassword = await bcrypt.hash(
        randomBytes(24).toString('hex'),
        12,
      );
      try {
        user = await this.authRepository.create({
          email: googleUser.email,
          name: googleUser.name,
          password: placeholderPassword,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          emailVerified: true,
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
          isActive: true,
        });
      } catch (error) {
        if (!this.isMissingColumnError(error)) {
          throw error;
        }

        this.logger.warn(
          'Detected outdated DB schema during Google signup. Creating user with minimal fields; please run latest Prisma migrations.',
        );

        user = await this.authRepository.create({
          email: googleUser.email,
          name: googleUser.name,
          password: placeholderPassword,
          isActive: true,
        });
      }
    } else {
      try {
        user = await this.authRepository.update(user.id, {
          googleId: user.googleId || googleUser.googleId,
          name: user.name || googleUser.name,
          avatar: user.avatar || googleUser.avatar,
          emailVerified: true,
          isActive: true,
          lastLoginAt: new Date(),
        });
      } catch (error) {
        if (this.isMissingColumnError(error)) {
          this.logger.warn(
            'Detected outdated DB schema during Google login. Skipping profile sync update; please run latest Prisma migrations.',
          );
        } else {
          throw error;
        }
      }
    }

    const tokens = await this.generateTokens(user.id, user.role);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findByIdWithProfile(userId);
    if (!user || !user.isActive) throw new UnauthorizedException();
    return user;
  }

  async refreshToken(userId: string) {
    const user = await this.authRepository.findByIdWithProfile(userId);
    if (!user || !user.isActive) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.role);
  }

  async logout(userId: string) {
    await this.authRepository.update(userId, {
      refreshTokenHash: null,
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role },
        {
          secret: this.configService.getOrThrow('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, role, type: 'refresh' },
        {
          secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    try {
      await this.authRepository.update(userId, { refreshTokenHash });
    } catch {
      // If production DB schema is behind, do not block login.
      // Refresh-token rotation may be impaired until the database is migrated.
    }

    return { accessToken, refreshToken };
  }
}
