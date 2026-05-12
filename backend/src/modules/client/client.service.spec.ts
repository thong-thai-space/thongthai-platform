import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ClientService } from './client.service';
import { ClientRepository } from './repositories/client.repository';

jest.mock('bcryptjs');

describe('ClientService', () => {
  let service: ClientService;
  let repository: jest.Mocked<ClientRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: ClientRepository,
          useValue: {
            findAllClients: jest.fn(),
            findClientById: jest.fn(),
            findClientByEmail: jest.fn(),
            createClient: jest.fn(),
            updateClient: jest.fn(),
            deactivateClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    repository = module.get(ClientRepository);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return only CLIENT role users', async () => {
      const clients = [{ id: '1', name: 'Client A', role: 'CLIENT' }];
      repository.findAllClients.mockResolvedValue(clients as any);

      const result = await service.findAll();
      expect(result).toEqual(clients);
      expect(repository.findAllClients).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return client with projects and invoices', async () => {
      const client = {
        id: '1',
        name: 'Client',
        clientProjects: [],
        clientInvoices: [],
      };
      repository.findClientById.mockResolvedValue(client as any);

      const result = await service.findOne('1');
      expect(result).toEqual(client);
    });

    it('should throw NotFoundException if client not found', async () => {
      repository.findClientById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      email: 'client@test.com',
      password: 'password123',
      name: 'New Client',
    };

    it('should create client with hashed password and CLIENT role', async () => {
      repository.findClientByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      repository.createClient.mockResolvedValue({
        id: '1',
        email: 'client@test.com',
        name: 'New Client',
        role: 'CLIENT',
      } as any);

      const result = await service.create(dto as any);
      expect(result.role).toBe('CLIENT');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(repository.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed-pw',
          role: 'CLIENT',
        }),
      );
    });

    it('should throw ConflictException for duplicate email', async () => {
      repository.findClientByEmail.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update client fields', async () => {
      const updated = { id: '1', name: 'Updated Client' };
      repository.updateClient.mockResolvedValue(updated as any);

      const result = await service.update('1', { name: 'Updated Client' } as any);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should soft-delete client', async () => {
      repository.deactivateClient.mockResolvedValue({
        id: '1',
        email: 'c@t.com',
        isActive: false,
      } as any);

      const result = await service.remove('1');
      expect(result.isActive).toBe(false);
      expect(repository.deactivateClient).toHaveBeenCalledWith('1');
    });
  });
});
