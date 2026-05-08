import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Integration Tests — API Architecture
 * Validates:
 * 1. API versioning (/api/v1 prefix)
 * 2. Global exception filter (standardized error responses)
 * 3. Response envelope (success responses)
 */
describe('API Architecture (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Versioning — /api/v1 prefix', () => {
    it('should respond at /api/v1/health', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should NOT respond at /api/health (old endpoint)', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');

      // Old endpoint should 404
      expect(res.status).toBe(404);
    });

    it('should return standardized error for 404', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/nonexistent-route',
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.statusCode).toBe(404);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.path).toContain('/nonexistent-route');
    });
  });

  describe('Response Envelope — Success Responses', () => {
    it('should wrap success responses with metadata', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.success).toBe(true);
    });
  });

  describe('Global Exception Filter — Error Responses', () => {
    it('should standardize validation errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toContain('BAD_REQUEST');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should include error code and message', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/nonexistent');

      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error).toHaveProperty('statusCode');
      expect(typeof res.body.error.code).toBe('string');
      expect(typeof res.body.error.message).toBe('string');
    });
  });

  describe('Authorization & IDOR Prevention', () => {
    it('should return 401 for unauthenticated requests to protected routes', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toContain('UNAUTHORIZED');
    });

    it('should respect rate limiting on auth endpoints', async () => {
      // Make 6 rapid requests to exceed threshold (limit: 5 req/min)
      const requests = Array(6)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).post('/api/v1/auth/register').send({
            email: 'test@example.com',
            password: 'TestPass123!',
            name: 'Test User',
            acceptTerms: true,
          }),
        );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some((res) => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
