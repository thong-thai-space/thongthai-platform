import { UnauthorizedException } from '@nestjs/common';
import type { AuthRepositoryPort } from '../domain/auth.repository.port';
import type { SessionIssuer } from './session-issuer.service';
import { SessionUseCase } from './session.use-case';

function buildSut() {
  const repo: jest.Mocked<AuthRepositoryPort> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByVerificationToken: jest.fn(),
    findByGoogleId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const sessionIssuer = {
    issueFor: jest.fn().mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    }),
    sessionFor: jest.fn(),
  } as unknown as jest.Mocked<SessionIssuer>;

  return { useCase: new SessionUseCase(repo, sessionIssuer), repo, sessionIssuer };
}

describe('SessionUseCase.getProfile', () => {
  it('returns user without password field', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({
      id: 'u1',
      isActive: true,
      password: 'secret',
      email: 'a@b.c',
    } as never);

    const result = await useCase.getProfile('u1');
    expect(result).not.toHaveProperty('password');
    expect((result as { email: string }).email).toBe('a@b.c');
  });

  it('throws for missing user', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue(null);

    await expect(useCase.getProfile('u1')).rejects.toThrow(UnauthorizedException);
  });

  it('throws for inactive user', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({ id: 'u1', isActive: false } as never);

    await expect(useCase.getProfile('u1')).rejects.toThrow(UnauthorizedException);
  });
});

describe('SessionUseCase.refresh', () => {
  it('issues new tokens for active user', async () => {
    const { useCase, repo, sessionIssuer } = buildSut();
    repo.findById.mockResolvedValue({
      id: 'u1',
      isActive: true,
      role: 'OWNER',
    } as never);

    const result = await useCase.refresh('u1');
    expect(sessionIssuer.issueFor).toHaveBeenCalled();
    expect(result.accessToken).toBe('a');
  });

  it('throws for inactive user', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({ id: 'u1', isActive: false } as never);

    await expect(useCase.refresh('u1')).rejects.toThrow(UnauthorizedException);
  });
});

describe('SessionUseCase.logout', () => {
  it('clears refresh hash and returns message', async () => {
    const { useCase, repo } = buildSut();

    const result = await useCase.logout('u1');
    expect(repo.update).toHaveBeenCalledWith('u1', { refreshTokenHash: null });
    expect(result.message).toContain('Logged out');
  });
});
