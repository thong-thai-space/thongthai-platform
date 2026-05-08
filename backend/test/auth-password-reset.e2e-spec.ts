import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';

const mockAuthService = {
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

describe('Auth Password Reset E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/forgot-password should return 200 with generic success message', async () => {
    mockAuthService.forgotPassword.mockResolvedValue({
      message:
        'If that email is registered, you will receive password reset instructions shortly.',
    });

    const res = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' })
      .expect(200);

    expect(res.body.message).toContain('If that email is registered');
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      undefined,
    );
  });

  it('POST /api/auth/forgot-password should validate email format', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('POST /api/auth/forgot-password should forward turnstile token to service', async () => {
    mockAuthService.forgotPassword.mockResolvedValue({
      message:
        'If that email is registered, you will receive password reset instructions shortly.',
    });

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com', turnstileToken: 'cf-turnstile-token' })
      .expect(200);

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      'cf-turnstile-token',
    );
  });

  it('POST /api/auth/forgot-password should map service UnauthorizedException to 401', async () => {
    mockAuthService.forgotPassword.mockRejectedValue(
      new UnauthorizedException('Security challenge validation failed'),
    );

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com', turnstileToken: 'bad-token' })
      .expect(401);
  });

  it('POST /api/auth/forgot-password should map service BadRequestException to 400', async () => {
    mockAuthService.forgotPassword.mockRejectedValue(
      new BadRequestException('Please complete the security challenge'),
    );

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' })
      .expect(400);
  });

  it('POST /api/auth/reset-password should return 200 on success', async () => {
    mockAuthService.resetPassword.mockResolvedValue({
      message:
        'Password has been reset successfully. Please sign in with your new password.',
    });

    const res = await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'valid-reset-token', newPassword: 'StrongPass1!' })
      .expect(200);

    expect(res.body.message).toContain('Password has been reset successfully');
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
      'valid-reset-token',
      'StrongPass1!',
      expect.any(String),
      undefined,
    );
  });

  it('POST /api/auth/reset-password should validate payload constraints', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: '', newPassword: 'weak' })
      .expect(400);
  });

  it('POST /api/auth/reset-password should forward turnstile token to service', async () => {
    mockAuthService.resetPassword.mockResolvedValue({
      message:
        'Password has been reset successfully. Please sign in with your new password.',
    });

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: 'valid-reset-token',
        newPassword: 'StrongPass1!',
        turnstileToken: 'cf-turnstile-token',
      })
      .expect(200);

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
      'valid-reset-token',
      'StrongPass1!',
      expect.any(String),
      'cf-turnstile-token',
    );
  });

  it('POST /api/auth/reset-password should map service BadRequestException to 400', async () => {
    mockAuthService.resetPassword.mockRejectedValue(
      new BadRequestException('Reset link is invalid or expired'),
    );

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'expired-token', newPassword: 'StrongPass1!' })
      .expect(400);
  });

  it('POST /api/auth/reset-password should map missing Turnstile token error to 400', async () => {
    mockAuthService.resetPassword.mockRejectedValue(
      new BadRequestException('Please complete the security challenge'),
    );

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'valid-reset-token', newPassword: 'StrongPass1!' })
      .expect(400);
  });

  it('POST /api/auth/reset-password should map service UnauthorizedException to 401', async () => {
    mockAuthService.resetPassword.mockRejectedValue(
      new UnauthorizedException('Security challenge validation failed'),
    );

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: 'valid-reset-token',
        newPassword: 'StrongPass1!',
        turnstileToken: 'bad-token',
      })
      .expect(401);
  });
});
