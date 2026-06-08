import { INestApplication } from '@nestjs/common';
import { createE2EApp, loginAsOwner, type E2EAgent } from '../utils/e2e-app';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * E2E: CRM → Ops/Billing pilot flow.
 * Owner creates a client → project → task → invoice, then drives the invoice
 * status state machine (valid + rejected transitions). Real Postgres + Redis.
 */
describe('CRM → Billing flow (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let agent: E2EAgent;

  const stamp = Date.now();
  const ownerEmail = `e2e-crm-owner-${stamp}@test.local`;
  const clientEmail = `e2e-crm-client-${stamp}@test.local`;

  let clientUserId: string;
  let projectId: string;
  let invoiceId: string;

  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    ({ agent } = await loginAsOwner(app, ownerEmail));
  });

  afterAll(async () => {
    // Best-effort cleanup (CI uses a fresh DB; this keeps local runs idempotent).
    try {
      if (invoiceId)
        await prisma.invoice.deleteMany({ where: { id: invoiceId } });
      if (projectId) {
        await prisma.task.deleteMany({ where: { projectId } });
        await prisma.project.deleteMany({ where: { id: projectId } });
      }
      if (clientUserId)
        await prisma.user.deleteMany({ where: { id: clientUserId } });
      await prisma.user.deleteMany({ where: { email: ownerEmail } });
    } catch {
      // ignore cleanup errors
    }
    await app.close();
  });

  it('creates a client', async () => {
    const res = await agent
      .post('/api/v1/clients')
      .send({ email: clientEmail, password: 'Demo@1234', name: 'E2E Client' })
      .expect(201);
    clientUserId = res.body.data.id;
    expect(clientUserId).toBeTruthy();
  });

  it('creates a project linked to the client', async () => {
    const res = await agent
      .post('/api/v1/projects')
      .send({ name: 'E2E Pilot Project', clientId: clientUserId })
      .expect(201);
    projectId = res.body.data.id;
    expect(projectId).toBeTruthy();
  });

  it('creates a task under the project', async () => {
    const res = await agent
      .post('/api/v1/tasks')
      .send({ title: 'E2E Task', projectId })
      .expect(201);
    expect(res.body.data.title).toBe('E2E Task');
  });

  it('creates a DRAFT invoice', async () => {
    const res = await agent
      .post('/api/v1/invoices')
      .send({
        clientId: clientUserId,
        projectId,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        items: [{ description: 'Audit dịch vụ', quantity: 1, unitPrice: 1000000 }],
      })
      .expect(201);
    invoiceId = res.body.data.id;
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('rejects an invalid DRAFT → PAID transition', async () => {
    const res = await agent
      .patch(`/api/v1/invoices/${invoiceId}`)
      .send({ status: 'PAID' })
      .expect(400);
    expect(res.body.error.message).toContain('Cannot transition');
  });

  it('allows DRAFT → SENT', async () => {
    const res = await agent
      .patch(`/api/v1/invoices/${invoiceId}`)
      .send({ status: 'SENT' })
      .expect(200);
    expect(res.body.data.status).toBe('SENT');
  });

  it('allows SENT → PAID', async () => {
    const res = await agent
      .patch(`/api/v1/invoices/${invoiceId}`)
      .send({ status: 'PAID' })
      .expect(200);
    expect(res.body.data.status).toBe('PAID');
  });

  it('rejects any transition out of the terminal PAID state', async () => {
    await agent
      .patch(`/api/v1/invoices/${invoiceId}`)
      .send({ status: 'SENT' })
      .expect(400);
  });
});
