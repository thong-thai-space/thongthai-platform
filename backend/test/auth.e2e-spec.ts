import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { PrismaService } from '../src/prisma/prisma.service';

const hashedPassword = bcrypt.hashSync('password123', 12);

const mockUser = {
  id: 'user-1',
  email: 'test@thongthai.space',
  name: 'Test User',
  password: hashedPassword,
  role: 'OWNER',
  locale: 'VI',
  isActive: true,
  phone: null,
  avatar: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('Auth E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-jwt-secret',
              JWT_REFRESH_SECRET: 'test-refresh-secret',
            }),
          ],
        }),
        PassportModule,
        JwtModule.register({}),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== POST /api/auth/register ====================

  describe('POST /api/auth/register', () => {
    it('should register a new user', () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@thongthai.space',
        name: 'New User',
        role: 'OWNER',
        locale: 'VI',
      });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'new@thongthai.space',
          password: 'password123',
          name: 'New User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe('new@thongthai.space');
        });
    });

    it('should reject duplicate email (409)', () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@thongthai.space',
          password: 'password123',
          name: 'Duplicate',
        })
        .expect(409);
    });

    it('should reject invalid email (400)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: 'Test',
        })
        .expect(400);
    });

    it('should reject short password (400)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          name: 'Test',
        })
        .expect(400);
    });

    it('should reject missing name (400)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
        })
        .expect(400);
    });
  });

  // ==================== POST /api/auth/login ====================

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@thongthai.space',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should reject wrong password (401)', () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@thongthai.space',
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should reject non-existent email (401)', () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should reject inactive user (401)', () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@thongthai.space',
          password: 'password123',
        })
        .expect(401);
    });
  });

  // ==================== GET /api/auth/me ====================

  describe('GET /api/auth/me', () => {
    it('should return profile for authenticated user', async () => {
      // JwtStrategy calls prisma.user.findUnique to validate token
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const token = jwtService.sign(
        { sub: 'user-1', role: 'OWNER' },
        { secret: 'test-jwt-secret', expiresIn: '15m' },
      );

      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test@thongthai.space');
        });
    });

    it('should reject without token (401)', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should reject with invalid token (401)', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  // ==================== POST /api/auth/refresh ====================

  describe('POST /api/auth/refresh', () => {
    it('should return new token pair', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const token = jwtService.sign(
        { sub: 'user-1', role: 'OWNER' },
        { secret: 'test-jwt-secret', expiresIn: '15m' },
      );

      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should reject without token (401)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(401);
    });
  });
});
