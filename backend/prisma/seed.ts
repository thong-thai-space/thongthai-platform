/**
 * Demo seed — a believable "Ký túc xá Thiên Đường" pilot so the platform can be
 * shown end-to-end (lead → client → project → playbook → invoice) without manual
 * data entry. Idempotent: safe to run repeatedly (upserts on natural keys).
 *
 *   pnpm seed
 *
 * Note: RAG retrieval needs VOYAGE_API_KEY to embed at query time; the seeded
 * document is metadata-only so the Knowledge Base list looks realistic.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = 'Demo@1234';

const KTX_PLAYBOOK = `# Cẩm nang AI cho Quản lý Ký túc xá

Bộ cẩm nang này đóng gói các tình huống dùng AI thực chiến cho vận hành ký túc xá,
kèm câu lệnh (prompt) mẫu để bạn dùng ngay với Claude / ChatGPT / Gemini.

## 1. Trợ lý trả lời nội quy 24/7

**Mục tiêu:** giảm tin nhắn hỏi đáp lặp lại (giờ giấc, quy định, thủ tục).

> Prompt mẫu:
> "Bạn là trợ lý của Ký túc xá Thiên Đường. Chỉ trả lời dựa trên nội quy được
> cung cấp dưới đây. Nếu không có thông tin, hãy nói 'Mình sẽ chuyển câu hỏi cho
> quản lý'. Nội quy: <dán nội quy>. Câu hỏi của sinh viên: <câu hỏi>."

## 2. Nhắc thu tiền phòng tự động

**Mục tiêu:** soạn tin nhắn nhắc đóng tiền lịch sự, đúng hạn.

> Prompt mẫu:
> "Soạn 1 tin nhắn Zalo ngắn (dưới 60 từ), giọng thân thiện, nhắc bạn {tên} đóng
> tiền phòng tháng {tháng}, số tiền {số tiền}, hạn {ngày}. Kèm số tài khoản."

## 3. Soạn thông báo & email hàng loạt

> Prompt mẫu:
> "Viết thông báo bảo trì điện nước cho tòa B ngày {ngày}, khung giờ {giờ}.
> Giọng rõ ràng, có lời xin lỗi vì bất tiện, dưới 120 từ."

## 4. Tổng hợp phản ánh của sinh viên

> Prompt mẫu:
> "Đây là 30 phản ánh trong tháng. Hãy nhóm thành tối đa 5 vấn đề chính, mỗi
> vấn đề kèm số lượt và 1 đề xuất xử lý. Dữ liệu: <dán danh sách>."

## 5. Checklist an toàn (giọng nói)

Dùng trợ lý giọng nói để nhân viên trực đọc nhanh checklist PCCC, an ninh ban đêm.

---

**Lưu ý quan trọng:** AI chỉ soạn nháp và tra cứu — *con người luôn duyệt trước khi
gửi*. Không để AI tự động gửi tin nhắn tài chính hay xử lý khiếu nại nhạy cảm.`;

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();

  // ── Founder (OWNER) ──
  const owner = await prisma.user.upsert({
    where: { email: 'hoangthai229@gmail.com' },
    update: {},
    create: {
      email: 'hoangthai229@gmail.com',
      name: 'Hoàng Thái',
      password,
      role: 'OWNER',
      emailVerified: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    },
  });

  // ── Pilot client (CLIENT) ──
  const client = await prisma.user.upsert({
    where: { email: 'ktx.thienduong@example.com' },
    update: {},
    create: {
      email: 'ktx.thienduong@example.com',
      name: 'Ký túc xá Thiên Đường',
      phone: '0905 123 456',
      password,
      role: 'CLIENT',
      locale: 'VI',
      emailVerified: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    },
  });

  // ── Published Playbook (the actual deliverable content) ──
  const playbook = await prisma.playbook.upsert({
    where: { slug: 'cam-nang-ai-quan-ly-ky-tuc-xa' },
    update: { contentMdx: KTX_PLAYBOOK, status: 'PUBLISHED' },
    create: {
      slug: 'cam-nang-ai-quan-ly-ky-tuc-xa',
      title: 'Cẩm nang AI cho Quản lý Ký túc xá',
      summary:
        'Tình huống AI thực chiến cho vận hành KTX: trả lời nội quy, nhắc thu phí, soạn thông báo, tổng hợp phản ánh.',
      contentMdx: KTX_PLAYBOOK,
      tags: ['ktx', 'vận hành', 'prompts'],
      status: 'PUBLISHED',
      publishedAt: now,
      authorId: owner.id,
    },
  });

  // ── Deliver the playbook to the client ──
  await prisma.playbookAssignment.upsert({
    where: {
      playbookId_clientId: { playbookId: playbook.id, clientId: client.id },
    },
    update: {},
    create: {
      playbookId: playbook.id,
      clientId: client.id,
      assignedById: owner.id,
      status: 'IN_PROGRESS',
      startedAt: now,
    },
  });

  // ── Project ──
  const existingProject = await prisma.project.findFirst({
    where: { name: 'Chuyển đổi số AI — KTX Thiên Đường', clientId: client.id },
  });
  const project =
    existingProject ??
    (await prisma.project.create({
      data: {
        name: 'Chuyển đổi số AI — KTX Thiên Đường',
        description:
          'Pilot: audit, đào tạo prompt, và trợ lý RAG tra cứu nội quy/quy trình.',
        status: 'IN_PROGRESS',
        currency: 'VND',
        ownerId: owner.id,
        clientId: client.id,
        techStack: ['Claude', 'RAG', 'pgvector'],
      },
    }));

  // ── Sample invoice ──
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-DEMO-0001' },
    update: {},
    create: {
      invoiceNumber: 'INV-DEMO-0001',
      status: 'SENT',
      issueDate: now,
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      currency: 'VND',
      subtotal: 30000000,
      tax: 3000000,
      discount: 3000000,
      total: 30000000,
      notes: 'Gói pilot ưu đãi cho khách đồng hành đầu tiên.',
      clientId: client.id,
      creatorId: owner.id,
      projectId: project.id,
      items: {
        create: [
          {
            description: 'AI Readiness Audit',
            quantity: 1,
            unitPrice: 12000000,
            amount: 12000000,
          },
          {
            description: 'Đào tạo Prompt Engineering (1 phòng ban)',
            quantity: 1,
            unitPrice: 8000000,
            amount: 8000000,
          },
          {
            description: 'Trợ lý RAG nội bộ (MVP)',
            quantity: 1,
            unitPrice: 10000000,
            amount: 10000000,
          },
        ],
      },
    },
  });

  // ── Inbound lead (funnel demo) ──
  const existingLead = await prisma.contactRequest.findFirst({
    where: { email: 'lienhe@nhatro-binhminh.vn' },
  });
  if (!existingLead) {
    await prisma.contactRequest.create({
      data: {
        name: 'Nhà trọ Bình Minh',
        email: 'lienhe@nhatro-binhminh.vn',
        phone: '0912 888 777',
        company: 'Nhà trọ Bình Minh',
        service: 'AI Readiness Audit',
        budget: '10-20 triệu',
        message:
          'Bên mình có 3 dãy trọ, muốn dùng AI trả lời khách thuê và nhắc thu tiền. Tư vấn giúp mình với.',
        status: 'NEW',
      },
    });
  }

  // ── RAG document (metadata only; chunks need VOYAGE_API_KEY at ingest) ──
  const existingDoc = await prisma.ragDocument.findFirst({
    where: { title: 'Nội quy Ký túc xá Thiên Đường', clientId: client.id },
  });
  if (!existingDoc) {
    await prisma.ragDocument.create({
      data: {
        title: 'Nội quy Ký túc xá Thiên Đường',
        source: 'TEXT',
        status: 'INDEXED',
        chunkCount: 8,
        clientId: client.id,
        uploadedById: owner.id,
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log(`   Owner:  ${owner.email}  (password: ${DEMO_PASSWORD})`);
  console.log(`   Client: ${client.email}  (password: ${DEMO_PASSWORD})`);
  console.log(
    '   + 1 published playbook, 1 assignment, 1 project, 1 invoice, 1 lead, 1 RAG doc.',
  );
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
