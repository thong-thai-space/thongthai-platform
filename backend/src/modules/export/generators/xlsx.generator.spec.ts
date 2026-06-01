import { XlsxGenerator } from './xlsx.generator';
import type { XlsxDocumentPayload } from '../templates/document.types';

const doc: XlsxDocumentPayload = {
  sheetName: 'Doanh thu',
  title: 'Báo cáo doanh thu',
  columns: [
    { header: 'Số hóa đơn', key: 'invoiceNumber', width: 18 },
    { header: 'Tổng tiền', key: 'total', numeric: true },
  ],
  rows: [{ invoiceNumber: 'INV-2026-001', total: 1000000 }],
  totals: { invoiceNumber: 'TỔNG', total: 1000000 },
};

describe('XlsxGenerator', () => {
  const generator = new XlsxGenerator();

  it('produces a valid, non-empty XLSX buffer', async () => {
    const buffer = await generator.generate(
      doc as unknown as Record<string, unknown>,
    );
    expect(buffer.length).toBeGreaterThan(0);
    // XLSX is a ZIP archive — starts with "PK".
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });
});
