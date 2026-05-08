import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ClientService } from './client.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcryptjs');

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return only CLIENT role users', async () => {
      const clients = [{ id: '1', name: 'Client A', role: 'CLIENT' }];
      mockPrisma.user.findMany.mockResolvedValue(clients);

      const result = await service.findAll();
      expect(result).toEqual(clients);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'CLIENT' },
        }),
      );
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
      mockPrisma.user.findUnique.mockResolvedValue(client);

      const result = await service.findOne('1');
      expect(result).toEqual(client);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

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
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: 'client@test.com',
        name: 'New Client',
        role: 'CLIENT',
      });

      const result = await service.create(dto as any);
      expect(result.role).toBe('CLIENT');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed-pw',
            role: 'CLIENT',
          }),
        }),
      );
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update client fields', async () => {
      const updated = { id: '1', name: 'Updated Client' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.update('1', {
        name: 'Updated Client',
      } as any);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should soft-delete client', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        email: 'c@t.com',
        isActive: false,
      });

      const result = await service.remove('1');
      expect(result.isActive).toBe(false);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1', role: 'CLIENT' },
          data: { isActive: false },
        }),
      );
    });
  });
});
