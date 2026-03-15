import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcryptjs');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'OWNER',
        locale: 'VI',
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'OWNER',
          locale: 'VI',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            password: 'hashed-password',
            name: 'Test User',
          }),
        }),
      );
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should login with correct credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        role: 'OWNER',
        isActive: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials (wrong password)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject inactive user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profile = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'OWNER',
        isActive: true,
      };
      mockPrisma.user.findUnique.mockResolvedValue(profile);

      const result = await service.getProfile('user-1');
      expect(result).toEqual(profile);
    });

    it('should throw for inactive user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: false,
      });

      await expect(service.getProfile('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new token pair', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'OWNER',
        isActive: true,
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refreshToken('user-1');
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should throw for invalid user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
