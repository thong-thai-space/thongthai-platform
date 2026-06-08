import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../../src/shared/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../../src/shared/interceptors/response-envelope.interceptor';
import { EMBEDDING_PROVIDER, EMBEDDING_DIMENSIONS } from '../../src/modules/rag/rag.constants';
import { AI_PROVIDER_PORT } from '../../src/modules/ai/ai.constants';
import type { EmbeddingProviderPort } from '../../src/modules/rag/domain/embedding.port';
import type { AiProviderPort } from '../../src/modules/ai/domain/ai.provider.port';

export const E2E_PASSWORD = 'Demo@1234';

// supertest agent type (its cookie jar carries the auth session across requests).
export type E2EAgent = ReturnType<typeof request.agent>;

// Deterministic fakes so e2e needs no external API keys (Voyage / Anthropic).
// A constant vector means cosine similarity = 1 for every chunk, so the query
// reliably retrieves the ingested document. Width tracks the production constant
// (and the pgvector column) to avoid drift.
const constantVector = () => new Array<number>(EMBEDDING_DIMENSIONS).fill(0.1);

const fakeEmbedding: EmbeddingProviderPort = {
  dimensions: EMBEDDING_DIMENSIONS,
  embedDocuments: (texts) => Promise.resolve(texts.map(() => constantVector())),
  embedQuery: () => Promise.resolve(constantVector()),
};

const fakeAiProvider: AiProviderPort = {
  createMessage: () =>
    Promise.resolve({
      text: 'Câu trả lời kiểm thử dựa trên tài liệu. [Source 1]',
      usage: { inputTokens: 1, outputTokens: 1 },
    }),
};

/**
 * Boots the full AppModule for HTTP e2e (real Postgres + Redis), mirroring the
 * production global setup (prefix, validation, exception filter, response
 * envelope, cookie parsing). AI + embedding providers are replaced with
 * deterministic fakes so the suite needs no external keys.
 */
export async function createE2EApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EMBEDDING_PROVIDER)
    .useValue(fakeEmbedding)
    .overrideProvider(AI_PROVIDER_PORT)
    .useValue(fakeAiProvider)
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  await app.init();
  return app;
}

/**
 * Upserts an OWNER user (email-verified) and logs in, returning a supertest agent
 * whose cookie jar carries the auth session for subsequent requests.
 */
export async function loginAsOwner(
  app: INestApplication,
  email: string,
): Promise<{ agent: E2EAgent; ownerId: string }> {
  const prisma = app.get(PrismaService);
  const now = new Date();
  const password = await bcrypt.hash(E2E_PASSWORD, 10);
  const owner = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'OWNER', emailVerified: true, isActive: true },
    create: {
      email,
      name: 'E2E Owner',
      password,
      role: 'OWNER',
      emailVerified: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    },
  });

  const agent = request.agent(app.getHttpServer());
  await agent
    .post('/api/v1/auth/login')
    .send({ email, password: E2E_PASSWORD })
    .expect(200);

  return { agent, ownerId: owner.id };
}
