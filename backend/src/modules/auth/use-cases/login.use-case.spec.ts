import { UnauthorizedException } from '@nestjs/common';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import { PasswordPolicy } from '../policies/password.policy';
import { SecurityChallengePolicy } from '../policies/security-challenge.policy';
import type { SessionIssuer } from './session-issuer.service';
import { LoginUseCase } from './login.use-case';

function buildSut() {
  const repo: jest.Mocked<AuthRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByVerificationToken: jest.fn(),
    findByGoogleId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const passwordPolicy = {
    compare: jest.fn(),
    hash: jest.fn().mockResolvedValue('hashed-pw'),
    assertStrong: jest.fn(),
  } as unknown as jest.Mocked<PasswordPolicy>;
  const challengePolicy = {
    enforce: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SecurityChallengePolicy>;
  const sessionIssuer = {
    issueFor: jest.fn(),
    sessionFor: jest.fn().mockResolvedValue({
      user: { id: 'u1' },
      accessToken: 'a',
      refreshToken: 'r',
    }),
  } as unknown as jest.Mocked<SessionIssuer>;

  const useCase = new LoginUseCase(
    repo,
    passwordPolicy,
    challengePolicy,
    sessionIssuer,
  );
  return { useCase, repo, passwordPolicy, challengePolicy, sessionIssuer };
}

const baseCmd = { email: 'a@b.com', password: 'pw' };

describe('LoginUseCase.login', () => {
  it('rejects unknown email', async () => {
    const { useCase, repo } = buildSut();
    repo.findByEmail.mockResolvedValue(null);

    await expect(useCase.login(baseCmd)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects inactive user', async () => {
    const { useCase, repo } = buildSut();
    repo.findByEmail.mockResolvedValue({
      id: 'u1',
      isActive: false,
      password: 'h',
    } as never);

    await expect(useCase.login(baseCmd)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when password missing', async () => {
    const { useCase, repo } = buildSut();
    repo.findByEmail.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: null,
    } as never);

    await expect(useCase.login(baseCmd)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when password mismatch', async () => {
    const { useCase, repo, passwordPolicy } = buildSut();
    repo.findByEmail.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: 'h',
      emailVerified: true,
    } as never);
    passwordPolicy.compare.mockResolvedValue(false);

    await expect(useCase.login(baseCmd)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects unverified email user without Google link', async () => {
    const { useCase, repo, passwordPolicy } = buildSut();
    repo.findByEmail.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: 'h',
      emailVerified: false,
      googleId: null,
    } as never);
    passwordPolicy.compare.mockResolvedValue(true);

    await expect(useCase.login(baseCmd)).rejects.toThrow(/verify your email/i);
  });

  it('issues session on success', async () => {
    const { useCase, repo, passwordPolicy, sessionIssuer } = buildSut();
    repo.findByEmail.mockResolvedValue({
      id: 'u1',
      role: 'OWNER',
      isActive: true,
      password: 'h',
      emailVerified: true,
    } as never);
    passwordPolicy.compare.mockResolvedValue(true);

    const session = await useCase.login(baseCmd);

    expect(sessionIssuer.sessionFor).toHaveBeenCalled();
    expect(session.accessToken).toBe('a');
  });
});

describe('LoginUseCase.loginWithGoogle', () => {
  const profile = {
    email: 'g@example.com',
    name: 'G',
    googleId: 'g123',
    avatar: 'http://x',
  };

  it('creates a new user when none exists', async () => {
    const { useCase, repo } = buildSut();
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 'u-new' } as never);
    repo.findById.mockResolvedValue({ id: 'u-new', role: 'OWNER' } as never);

    await useCase.loginWithGoogle(profile);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: profile.email,
        googleId: profile.googleId,
        emailVerified: true,
      }),
    );
  });

  it('syncs profile on existing user', async () => {
    const { useCase, repo } = buildSut();
    repo.findByEmail.mockResolvedValue({
      id: 'u-existing',
      googleId: null,
      name: null,
      avatar: null,
    } as never);
    repo.findById.mockResolvedValue({ id: 'u-existing', role: 'OWNER' } as never);

    await useCase.loginWithGoogle(profile);

    expect(repo.update).toHaveBeenCalledWith(
      'u-existing',
      expect.objectContaining({
        googleId: profile.googleId,
        emailVerified: true,
      }),
    );
  });
});
