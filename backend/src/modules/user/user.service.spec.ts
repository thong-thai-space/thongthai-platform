import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../shared/mail/mail.service';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockMailService = {
  sendInvitation: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3000'),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: '1', email: 'a@b.com', name: 'User A' },
        { id: '2', email: 'c@d.com', name: 'User B' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: '1', email: 'a@b.com', name: 'User' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne('1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return user', async () => {
      const updated = { id: '1', email: 'a@b.com', name: 'Updated' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Updated' });
      expect(result).toEqual(updated);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated' },
        select: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should soft-delete user by setting isActive to false', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        isActive: false,
      });

      const result = await service.remove('1');
      expect(result.isActive).toBe(false);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
        select: { id: true, email: true, isActive: true },
      });
    });
  });

  describe('getProfile', () => {
    it('should delegate to findOne', async () => {
      const user = { id: '1', email: 'a@b.com', name: 'User' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfile('1');
      expect(result).toEqual(user);
    });
  });
});
