import { INestApplication } from '@nestjs/common';
import { createE2EApp, loginAsOwner, type E2EAgent } from '../utils/e2e-app';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * E2E: RAG knowledge-base flow (ingest → query → human review).
 * Embedding + LLM are faked (see e2e-app), so this exercises the real pipeline —
 * chunking, pgvector storage/retrieval, draft generation, and the
 * human-in-the-loop approval — against real Postgres + Redis.
 */
describe('RAG ingest → query → approve (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let agent: E2EAgent;

  const stamp = Date.now();
  const ownerEmail = `e2e-rag-owner-${stamp}@test.local`;
  const clientEmail = `e2e-rag-client-${stamp}@test.local`;

  let clientUserId: string;
  let documentId: string;
  let answerId: string;

  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    ({ agent } = await loginAsOwner(app, ownerEmail));

    const client = await agent
      .post('/api/v1/clients')
      .send({ email: clientEmail, password: 'Demo@1234', name: 'RAG Client' })
      .expect(201);
    clientUserId = client.body.data.id;
  });

  afterAll(async () => {
    try {
      if (clientUserId) {
        // Chunks/documents/answers cascade off the client; remove explicitly.
        await prisma.ragAnswer.deleteMany({ where: { clientId: clientUserId } });
        await prisma.ragChunk.deleteMany({ where: { clientId: clientUserId } });
        await prisma.ragDocument.deleteMany({
          where: { clientId: clientUserId },
        });
        await prisma.user.deleteMany({ where: { id: clientUserId } });
      }
      await prisma.user.deleteMany({ where: { email: ownerEmail } });
    } catch {
      // ignore cleanup errors
    }
    await app.close();
  });

  it('ingests a document synchronously and indexes chunks', async () => {
    const res = await agent
      .post('/api/v1/rag/documents')
      .send({
        clientId: clientUserId,
        title: 'Hồ sơ năng lực',
        text: 'Thông Thái Space cung cấp dịch vụ phát triển Web, ứng dụng di động, tích hợp AI và tư vấn CNTT cho doanh nghiệp vừa và nhỏ tại Việt Nam.',
      })
      .expect(201);
    documentId = res.body.data.documentId;
    expect(documentId).toBeTruthy();
    expect(res.body.data.chunkCount).toBeGreaterThan(0);
  });

  it('queries the knowledge base and returns a DRAFT answer with citations', async () => {
    const res = await agent
      .post('/api/v1/rag/query')
      .send({ clientId: clientUserId, question: 'Thông Thái Space cung cấp dịch vụ gì?' })
      .expect(201);
    answerId = res.body.data.id;
    expect(answerId).toBeTruthy();
    expect(res.body.data.status).toBe('DRAFT');
    expect(Array.isArray(res.body.data.citedChunkIds)).toBe(true);
    expect(res.body.data.citedChunkIds.length).toBeGreaterThan(0);
  });

  it('approves the draft answer (human-in-the-loop)', async () => {
    const res = await agent
      .post(`/api/v1/rag/answers/${answerId}/review`)
      .send({ decision: 'APPROVE' })
      .expect(201);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('rejects re-reviewing an already-approved answer', async () => {
    await agent
      .post(`/api/v1/rag/answers/${answerId}/review`)
      .send({ decision: 'REJECT' })
      .expect(409);
  });
});
