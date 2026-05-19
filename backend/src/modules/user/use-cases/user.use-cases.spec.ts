import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { UserRepositoryPort } from '../domain/user.repository.port';
import type { UserPasswordHasherPort } from '../domain/user.password-hasher.port';
import { UserUseCases } from './user.use-cases';

function buildSut() {
  const repo: jest.Mocked<UserRepositoryPort> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  const hasher: jest.Mocked<UserPasswordHasherPort> = {
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn(),
  };
  return { useCase: new UserUseCases(repo, hasher), repo, hasher };
}

describe('UserUseCases.findOne', () => {
  it('throws NotFound when user missing', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue(null);
    await expect(useCase.findOne('u1')).rejects.toThrow(NotFoundException);
  });

  it('returns user when present', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({ id: 'u1' } as never);
    await expect(useCase.findOne('u1')).resolves.toEqual({ id: 'u1' });
  });
});

describe('UserUseCases.changePassword', () => {
  it('throws NotFound when user missing', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.changePassword('u1', {
        currentPassword: 'old',
        newPassword: 'New1!aaaa',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects when current password does not match', async () => {
    const { useCase, repo, hasher } = buildSut();
    repo.findById.mockResolvedValue({ id: 'u1', password: 'h' } as never);
    hasher.compare.mockResolvedValue(false);

    await expect(
      useCase.changePassword('u1', {
        currentPassword: 'wrong',
        newPassword: 'New1!aaaa',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects weak new password', async () => {
    const { useCase, repo, hasher } = buildSut();
    repo.findById.mockResolvedValue({ id: 'u1', password: 'h' } as never);
    hasher.compare.mockResolvedValue(true);

    await expect(
      useCase.changePassword('u1', {
        currentPassword: 'old',
        newPassword: 'weak',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('persists new hashed password on success', async () => {
    const { useCase, repo, hasher } = buildSut();
    repo.findById.mockResolvedValue({ id: 'u1', password: 'h' } as never);
    hasher.compare.mockResolvedValue(true);

    await useCase.changePassword('u1', {
      currentPassword: 'old',
      newPassword: 'New1!aaaa',
    });

    expect(repo.update).toHaveBeenCalledWith('u1', { password: 'hashed' });
  });
});

describe('UserUseCases.createMember', () => {
  const dto = {
    email: 'm@x.com',
    password: 'Strong1!aaaa',
    name: 'Member',
  } as never;

  it('rejects weak password', async () => {
    const { useCase, repo } = buildSut();
    await expect(
      useCase.createMember({ ...(dto as object), password: 'short' } as never),
    ).rejects.toThrow(BadRequestException);
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    const { useCase, repo } = buildSut();
    repo.findByEmail.mockResolvedValue({ id: 'existing' } as never);
    await expect(useCase.createMember(dto)).rejects.toThrow(ConflictException);
  });

  it('creates a MEMBER with hashed password', async () => {
    const { useCase, repo } = buildSut();
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 'new' } as never);

    await useCase.createMember(dto);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed', role: 'MEMBER' }),
    );
  });
});
