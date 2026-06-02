import { PdfGenerator } from './pdf.generator';
import type { PdfDocumentPayload } from '../templates/document.types';

// Smoke test — the value of a PDF is hard to assert structurally, so we verify
// it produces a valid, non-empty PDF and, crucially, that embedded Vietnamese
// text does not crash the renderer (the reason we ship a TTF font).

const doc: PdfDocumentPayload = {
  title: 'HÓA ĐƠN',
  subtitle: 'INV-2026-001',
  brand: 'Thông Thái Space',
  meta: [{ label: 'Trạng thái', value: 'SENT' }],
  infoBlocks: [
    { heading: 'Khách hàng', lines: ['Khách Hàng Thử Nghiệm', 'Đỗ Thị Mỹ Lệ'] },
  ],
  table: {
    columns: [
      { header: 'Mô tả', key: 'description', width: 4 },
      { header: 'Thành tiền', key: 'amount', align: 'right', width: 2 },
    ],
    rows: [{ description: 'Tư vấn chiến lược AI', amount: '1.000.000 VND' }],
  },
  totals: [{ label: 'Tổng cộng', value: '1.000.000 VND', emphasize: true }],
  notes: 'Cảm ơn quý khách đã sử dụng dịch vụ.',
  footer: 'Thông Thái Space',
};

describe('PdfGenerator', () => {
  const generator = new PdfGenerator();

  it('produces a valid, non-empty PDF buffer', async () => {
    const buffer = await generator.generate(
      doc as unknown as Record<string, unknown>,
    );
    expect(buffer.length).toBeGreaterThan(0);
    // PDF files start with the "%PDF" magic bytes.
    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('renders Vietnamese diacritics without throwing', async () => {
    await expect(
      generator.generate(doc as unknown as Record<string, unknown>),
    ).resolves.toBeInstanceOf(Buffer);
  });
});
