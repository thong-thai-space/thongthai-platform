import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { AuthEmailNotifierPort } from '../domain/auth.email-notifier.port';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import { PasswordPolicy } from '../policies/password.policy';
import { SecurityChallengePolicy } from '../policies/security-challenge.policy';
import type { SessionIssuer } from './session-issuer.service';
import { RegisterUseCase } from './register.use-case';

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
  const passwordPolicy = {
    assertStrong: jest.fn(),
    hash: jest.fn().mockResolvedValue('hashed-pw'),
    compare: jest.fn(),
  } as unknown as jest.Mocked<PasswordPolicy>;
  const challengePolicy = {
    enforce: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SecurityChallengePolicy>;
  const sessionIssuer = {
    issueFor: jest.fn(),
    sessionFor: jest.fn(),
  } as unknown as jest.Mocked<SessionIssuer>;

  const useCase = new RegisterUseCase(
    repo,
    notifier,
    passwordPolicy,
    challengePolicy,
    sessionIssuer,
  );
  return { useCase, repo, notifier, passwordPolicy, challengePolicy, sessionIssuer };
}

describe('RegisterUseCase', () => {
  describe('register', () => {
    const cmd = {
      email: 'new@example.com',
      password: 'Strong1!password',
      name: 'New User',
    };

    it('creates a new user and sends verification email', async () => {
      const { useCase, repo, notifier, passwordPolicy } = buildSut();
      repo.findByEmail.mockResolvedValue(null);

      const result = await useCase.register(cmd);

      expect(passwordPolicy.assertStrong).toHaveBeenCalledWith(cmd.password);
      expect(passwordPolicy.hash).toHaveBeenCalledWith(cmd.password);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: cmd.email,
          password: 'hashed-pw',
          emailVerified: false,
        }),
      );
      expect(notifier.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Registration successful');
    });

    it('rejects when verified user already exists', async () => {
      const { useCase, repo } = buildSut();
      repo.findByEmail.mockResolvedValue({
        id: 'u1',
        emailVerified: true,
        googleId: null,
      } as never);

      await expect(useCase.register(cmd)).rejects.toThrow(ConflictException);
    });

    it('rejects when Google-linked user already exists', async () => {
      const { useCase, repo } = buildSut();
      repo.findByEmail.mockResolvedValue({
        id: 'u1',
        emailVerified: false,
        googleId: 'g1',
      } as never);

      await expect(useCase.register(cmd)).rejects.toThrow(ConflictException);
    });

    it('updates unverified user without overwriting verified accounts', async () => {
      const { useCase, repo, notifier } = buildSut();
      repo.findByEmail.mockResolvedValue({
        id: 'u1',
        emailVerified: false,
        googleId: null,
      } as never);

      const result = await useCase.register(cmd);

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ password: 'hashed-pw' }),
      );
      expect(notifier.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('pending verification');
    });

    it('rejects weak passwords before touching the repository', async () => {
      const { useCase, repo, passwordPolicy } = buildSut();
      passwordPolicy.assertStrong.mockImplementation(() => {
        throw new BadRequestException('weak');
      });

      await expect(useCase.register(cmd)).rejects.toThrow(BadRequestException);
      expect(repo.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('throws for unknown token', async () => {
      const { useCase, repo } = buildSut();
      repo.findByVerificationToken.mockResolvedValue(null);

      await expect(useCase.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });

    it('throws for already verified user', async () => {
      const { useCase, repo } = buildSut();
      repo.findByVerificationToken.mockResolvedValue({
        id: 'u1',
        emailVerified: true,
      } as never);

      await expect(useCase.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });

    it('throws for expired token', async () => {
      const { useCase, repo } = buildSut();
      repo.findByVerificationToken.mockResolvedValue({
        id: 'u1',
        emailVerified: false,
        emailVerifyTokenExpiry: new Date(Date.now() - 1000),
      } as never);

      await expect(useCase.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });

    it('marks email verified and issues a session', async () => {
      const { useCase, repo, sessionIssuer } = buildSut();
      const user = {
        id: 'u1',
        role: 'OWNER',
        emailVerified: false,
        emailVerifyTokenExpiry: new Date(Date.now() + 60_000),
      };
      repo.findByVerificationToken.mockResolvedValue(user as never);
      repo.update.mockResolvedValue({ id: 'u1' } as never);
      repo.findById.mockResolvedValue(user as never);
      sessionIssuer.sessionFor.mockResolvedValue({
        user: user as never,
        accessToken: 'a',
        refreshToken: 'r',
      });

      const result = await useCase.verifyEmail('token');

      expect(repo.update).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ emailVerified: true, emailVerifyToken: null }),
      );
      expect(result.accessToken).toBe('a');
    });
  });

  describe('resendVerification', () => {
    it('returns generic message when user missing', async () => {
      const { useCase, repo, notifier } = buildSut();
      repo.findByEmail.mockResolvedValue(null);

      const result = await useCase.resendVerification('x@example.com');
      expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('If that email');
    });

    it('returns generic message when user is already verified', async () => {
      const { useCase, repo, notifier } = buildSut();
      repo.findByEmail.mockResolvedValue({ emailVerified: true } as never);

      await useCase.resendVerification('x@example.com');
      expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('refreshes token and sends email for unverified user', async () => {
      const { useCase, repo, notifier } = buildSut();
      repo.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'x@example.com',
        name: 'X',
        emailVerified: false,
      } as never);

      await useCase.resendVerification('x@example.com');

      expect(repo.update).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ emailVerifyToken: expect.any(String) }),
      );
      expect(notifier.sendVerificationEmail).toHaveBeenCalled();
    });
  });
});
