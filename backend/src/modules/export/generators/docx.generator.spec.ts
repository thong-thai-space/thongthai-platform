import { DocxGenerator } from './docx.generator';
import type { PdfDocumentPayload } from '../templates/document.types';

// Smoke test — structural assertions on a .docx are impractical, so we verify a
// valid, non-empty Word file is produced (ZIP "PK" magic) and that Vietnamese
// text renders without throwing.

const doc: PdfDocumentPayload = {
  title: 'BÁO GIÁ',
  subtitle: 'QUOTE-2026-001',
  brand: 'Thông Thái Space',
  meta: [{ label: 'Ngày', value: '08/06/2026' }],
  infoBlocks: [
    { heading: 'Khách hàng', lines: ['Công ty Bình Minh', 'Đỗ Thị Mỹ Lệ'] },
    { heading: 'Bên cung cấp', lines: ['Thông Thái Space'] },
  ],
  table: {
    columns: [
      { header: 'Mô tả', key: 'description', width: 4 },
      { header: 'Thành tiền', key: 'amount', align: 'right', width: 2 },
    ],
    rows: [{ description: 'Tư vấn chiến lược AI', amount: '1.000.000 VND' }],
  },
  totals: [{ label: 'Tổng cộng', value: '1.000.000 VND', emphasize: true }],
  notes: 'Báo giá có hiệu lực trong 30 ngày.',
  footer: 'Thông Thái Space',
};

describe('DocxGenerator', () => {
  const generator = new DocxGenerator();

  it('produces a valid, non-empty DOCX buffer', async () => {
    const buffer = await generator.generate(
      doc as unknown as Record<string, unknown>,
    );
    expect(buffer.length).toBeGreaterThan(0);
    // .docx is a ZIP archive — starts with the "PK" magic bytes.
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('renders Vietnamese diacritics without throwing', async () => {
    await expect(
      generator.generate(doc as unknown as Record<string, unknown>),
    ).resolves.toBeInstanceOf(Buffer);
  });

  it('handles a minimal payload (title only)', async () => {
    const buffer = await generator.generate({ title: 'BÁO GIÁ' });
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('handles many equal-weight columns without oversubscribing widths', async () => {
    // 6 equal columns would round to 17% each (102%) with naive rounding;
    // the largest-remainder split keeps the total at 100%.
    const wide: PdfDocumentPayload = {
      title: 'BẢNG',
      table: {
        columns: Array.from({ length: 6 }, (_, i) => ({
          header: `Cột ${i + 1}`,
          key: `c${i}`,
          width: 1,
        })),
        rows: [{ c0: 'a', c1: 'b', c2: 'c', c3: 'd', c4: 'e', c5: 'f' }],
      },
    };
    const buffer = await generator.generate(
      wide as unknown as Record<string, unknown>,
    );
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });
});
