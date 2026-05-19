import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { AuthEmailNotifierPort } from '../domain/auth.email-notifier.port';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import type { AuthTokenServicePort } from '../domain/auth.token-service.port';
import { PasswordPolicy } from '../policies/password.policy';
import { SecurityChallengePolicy } from '../policies/security-challenge.policy';
import { PasswordResetUseCase } from './password.use-case';

function buildSut() {
  const repo: jest.Mocked<AuthRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByVerificationToken: jest.fn(),
    findByGoogleId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const notifier: jest.Mocked<AuthEmailNotifierPort> = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };
  const tokens: jest.Mocked<AuthTokenServicePort> = {
    generateSessionTokens: jest.fn(),
    generateResetPasswordToken: jest.fn().mockResolvedValue('reset-token'),
    verifyResetPasswordToken: jest.fn(),
    hashRefreshToken: jest.fn(),
  };
  const passwordPolicy = {
    assertStrong: jest.fn(),
    hash: jest.fn().mockResolvedValue('hashed-pw'),
    compare: jest.fn(),
  } as unknown as jest.Mocked<PasswordPolicy>;
  const challengePolicy = {
    enforce: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SecurityChallengePolicy>;

  const useCase = new PasswordResetUseCase(
    repo,
    notifier,
    tokens,
    passwordPolicy,
    challengePolicy,
  );
  return { useCase, repo, notifier, tokens, passwordPolicy, challengePolicy };
}

describe('PasswordResetUseCase.forgotPassword', () => {
  it('returns generic message and skips email when user missing', async () => {
    const { useCase, repo, notifier } = buildSut();
    repo.findByEmail.mockResolvedValue(null);

    const result = await useCase.forgotPassword({ email: 'x@y.z' });

    expect(notifier.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(result.message).toContain('If that email');
  });

  it('sends reset email for active local user', async () => {
    const { useCase, repo, notifier } = buildSut();
    repo.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'x@y.z',
      name: 'X',
      isActive: true,
      password: 'h',
    } as never);

    await useCase.forgotPassword({ email: 'x@y.z' });
    expect(notifier.sendPasswordResetEmail).toHaveBeenCalledWith(
      'x@y.z',
      'X',
      'reset-token',
    );
  });
});

describe('PasswordResetUseCase.resetPassword', () => {
  it('rejects invalid token', async () => {
    const { useCase, tokens } = buildSut();
    tokens.verifyResetPasswordToken.mockRejectedValue(new Error('expired'));

    await expect(
      useCase.resetPassword({ token: 't', newPassword: 'Strong1!aa' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects payload with wrong type', async () => {
    const { useCase, tokens } = buildSut();
    tokens.verifyResetPasswordToken.mockResolvedValue({
      sub: 'u1',
      type: 'wrong',
      fp: 'abc',
    } as never);

    await expect(
      useCase.resetPassword({ token: 't', newPassword: 'Strong1!aa' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects when fingerprint mismatches', async () => {
    const { useCase, tokens, repo } = buildSut();
    tokens.verifyResetPasswordToken.mockResolvedValue({
      sub: 'u1',
      type: 'reset_password',
      fp: 'mismatch',
    });
    repo.findById.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: 'current-hash',
    } as never);

    await expect(
      useCase.resetPassword({ token: 't', newPassword: 'Strong1!aa' }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates password and clears refresh hash on valid token', async () => {
    const { useCase, tokens, repo } = buildSut();
    const fp = createHash('sha256').update('current-hash').digest('hex');

    tokens.verifyResetPasswordToken.mockResolvedValue({
      sub: 'u1',
      type: 'reset_password',
      fp,
    });
    repo.findById.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: 'current-hash',
    } as never);

    const result = await useCase.resetPassword({
      token: 't',
      newPassword: 'Strong1!aa',
    });

    expect(repo.update).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        password: 'hashed-pw',
        refreshTokenHash: null,
      }),
    );
    expect(result.message).toContain('reset successfully');
  });
});
