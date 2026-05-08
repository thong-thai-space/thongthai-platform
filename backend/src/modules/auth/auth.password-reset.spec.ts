import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { EmailService } from '../email/email.service';
import { TurnstileService } from '../../common/turnstile/turnstile.service';

jest.mock('bcryptjs');

describe('AuthService password reset flow', () => {
  let service: AuthService;

  const mockAuthRepository = {
    findByEmail: jest.fn(),
    findByIdWithProfile: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  const mockTurnstileService = {
    isEnabled: jest.fn().mockReturnValue(false),
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: TurnstileService, useValue: mockTurnstileService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockTurnstileService.isEnabled.mockReturnValue(false);
  });

  it('forgotPassword should send reset email for active local user', async () => {
    mockAuthRepository.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User One',
      password: 'hashed-password',
      isActive: true,
    });
    mockJwtService.signAsync.mockResolvedValue('reset-token');

    const result = await service.forgotPassword('user@example.com');

    expect(mockJwtService.signAsync).toHaveBeenCalled();
    expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'user@example.com',
      'User One',
      'reset-token',
    );
    expect(result.message).toContain('If that email is registered');
  });

  it('forgotPassword should return generic response for non-existing email', async () => {
    mockAuthRepository.findByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword('missing@example.com');

    expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(result.message).toContain('If that email is registered');
  });

  it('resetPassword should throw for invalid token', async () => {
    mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(
      service.resetPassword('invalid-token', 'StrongPass1!'),
    ).rejects.toThrow(BadRequestException);
  });

  it('forgotPassword should throw when Turnstile is enabled but token is missing', async () => {
    mockTurnstileService.isEnabled.mockReturnValue(true);

    await expect(
      service.forgotPassword('user@example.com', '127.0.0.1', undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('forgotPassword should throw when Turnstile validation fails', async () => {
    mockTurnstileService.isEnabled.mockReturnValue(true);
    mockTurnstileService.verifyToken.mockResolvedValue(false);

    await expect(
      service.forgotPassword('user@example.com', '127.0.0.1', 'bad-turnstile-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('resetPassword should throw when Turnstile validation fails', async () => {
    mockTurnstileService.isEnabled.mockReturnValue(true);
    mockTurnstileService.verifyToken.mockResolvedValue(false);

    await expect(
      service.resetPassword('valid-format-token', 'StrongPass1!', '127.0.0.1', 'bad-turnstile-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('resetPassword should throw when token fingerprint mismatches current password fingerprint', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'u1',
      type: 'reset_password',
      fp: 'token-fingerprint-does-not-match',
    });

    mockAuthRepository.findByIdWithProfile.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: 'current-hash',
    });

    await expect(
      service.resetPassword('valid-format-token', 'StrongPass1!'),
    ).rejects.toThrow(BadRequestException);
    expect(mockAuthRepository.update).not.toHaveBeenCalled();
  });

  it('resetPassword should throw for malformed payload even if token verifies', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'u1',
      type: 'wrong_type',
      fp: 'abc',
    });

    await expect(
      service.resetPassword('token-with-wrong-type', 'StrongPass1!'),
    ).rejects.toThrow(BadRequestException);
  });

  it('resetPassword should update password and clear refresh token hash for valid token', async () => {
    const expectedFp = createHash('sha256').update('current-hash').digest('hex');

    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'u1',
      type: 'reset_password',
      fp: expectedFp,
    });

    mockAuthRepository.findByIdWithProfile.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: 'current-hash',
    });

    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    mockAuthRepository.update.mockResolvedValue({ id: 'u1' });

    const result = await service.resetPassword('valid-token', 'StrongPass1!');

    expect(mockAuthRepository.update).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        password: 'new-hash',
        refreshTokenHash: null,
      }),
    );
    expect(result.message).toContain('Password has been reset successfully');
  });
});
