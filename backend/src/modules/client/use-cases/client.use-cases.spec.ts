import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { ClientRepositoryPort } from '../domain/client.repository.port';
import type { ClientPasswordHasherPort } from '../domain/client.password-hasher.port';
import { ClientUseCases } from './client.use-cases';

function buildSut() {
  const repo: jest.Mocked<ClientRepositoryPort> = {
    findAllClients: jest.fn(),
    findClientById: jest.fn(),
    findClientByEmail: jest.fn(),
    createClient: jest.fn(),
    updateClient: jest.fn(),
    deactivateClient: jest.fn(),
  };
  const hasher: jest.Mocked<ClientPasswordHasherPort> = {
    hash: jest.fn().mockResolvedValue('hashed'),
  };
  return { useCase: new ClientUseCases(repo, hasher), repo, hasher };
}

describe('ClientUseCases.findOne', () => {
  it('throws NotFound when client missing', async () => {
    const { useCase, repo } = buildSut();
    repo.findClientById.mockResolvedValue(null);
    await expect(useCase.findOne('c1')).rejects.toThrow(NotFoundException);
  });
});

describe('ClientUseCases.create', () => {
  const dto = {
    email: 'c@x.com',
    password: 'Strong1!aaaa',
    name: 'Client',
  } as never;

  it('rejects weak password', async () => {
    const { useCase, repo } = buildSut();
    await expect(
      useCase.create({ ...(dto as object), password: 'weak' } as never),
    ).rejects.toThrow(BadRequestException);
    expect(repo.findClientByEmail).not.toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    const { useCase, repo } = buildSut();
    repo.findClientByEmail.mockResolvedValue({} as never);
    await expect(useCase.create(dto)).rejects.toThrow(ConflictException);
  });

  it('creates client with CLIENT role and hashed password', async () => {
    const { useCase, repo } = buildSut();
    repo.findClientByEmail.mockResolvedValue(null);
    repo.createClient.mockResolvedValue({ id: 'c1' } as never);

    await useCase.create(dto);
    expect(repo.createClient).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed', role: 'CLIENT' }),
    );
  });
});
