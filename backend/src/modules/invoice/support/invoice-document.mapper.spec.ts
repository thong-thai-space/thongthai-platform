import type { InvoiceWithRelations } from '../domain/invoice.repository.port';
import {
  formatMoney,
  invoicePdfFilename,
  invoiceToPdfDocument,
  invoicesToRevenueReport,
} from './invoice-document.mapper';

// Pattern: Pure unit test — the mapper does no I/O, so we feed plain objects.

function buildInvoice(
  overrides: Partial<InvoiceWithRelations> = {},
): InvoiceWithRelations {
  return {
    id: 'inv_1',
    invoiceNumber: 'INV-2026-001',
    status: 'SENT',
    issueDate: new Date('2026-06-01'),
    dueDate: new Date('2026-06-15'),
    subtotal: 1000000 as never,
    tax: 0 as never,
    discount: 0 as never,
    total: 1000000 as never,
    totalUsd: null,
    currency: 'VND',
    notes: null,
    projectId: null,
    clientId: 'client_1',
    creatorId: 'staff_1',
    paidAt: null,
    paidAmount: null,
    paymentMethod: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'it_1',
        description: 'Tư vấn AI',
        quantity: 2,
        unitPrice: 500000 as never,
        amount: 1000000 as never,
        invoiceId: 'inv_1',
      },
    ],
    client: {
      id: 'client_1',
      name: 'Khách Hàng Thử Nghiệm',
      email: 'khach@example.com',
      phone: '0900000000',
    } as never,
    creator: {
      id: 'staff_1',
      name: 'Người Lập',
      email: 'staff@example.com',
    } as never,
    project: null,
    ...overrides,
  } as InvoiceWithRelations;
}

describe('formatMoney', () => {
  it('formats VND with no decimals', () => {
    expect(formatMoney(1000000, 'VND')).toBe('1.000.000 VND');
  });

  it('formats USD with two decimals', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('1.234,50 USD');
  });

  it('treats null/undefined as zero', () => {
    expect(formatMoney(null, 'VND')).toBe('0 VND');
  });
});

describe('invoicePdfFilename', () => {
  it('sanitizes the invoice number into a safe filename', () => {
    expect(invoicePdfFilename('INV/2026 001')).toBe('invoice-INV_2026_001.pdf');
  });
});

describe('invoiceToPdfDocument', () => {
  it('maps header, parties, items and a grand total', () => {
    const doc = invoiceToPdfDocument(buildInvoice());
    expect(doc.subtitle).toBe('INV-2026-001');
    expect(doc.infoBlocks?.[1].lines).toContain('Khách Hàng Thử Nghiệm');
    expect(doc.table?.rows).toHaveLength(1);
    const grand = doc.totals?.find((t) => t.emphasize);
    expect(grand?.value).toBe('1.000.000 VND');
  });

  it('omits discount and tax lines when they are zero', () => {
    const labels = invoiceToPdfDocument(buildInvoice()).totals?.map(
      (t) => t.label,
    );
    expect(labels).not.toContain('Giảm giá');
    expect(labels).not.toContain('Thuế');
  });

  it('includes discount and tax lines when present', () => {
    const labels = invoiceToPdfDocument(
      buildInvoice({ discount: 50000 as never, tax: 80000 as never }),
    ).totals?.map((t) => t.label);
    expect(labels).toContain('Giảm giá');
    expect(labels).toContain('Thuế');
  });
});

describe('invoicesToRevenueReport', () => {
  it('sums totals and paid amounts into one totals row per currency', () => {
    const report = invoicesToRevenueReport([
      buildInvoice({ total: 1000000 as never }),
      buildInvoice({
        total: 500000 as never,
        paidAt: new Date(),
        paidAmount: 500000 as never,
      }),
    ]);
    expect(report.rows).toHaveLength(2);
    // Both invoices are VND → a single VND totals row.
    expect(report.totals).toHaveLength(1);
    const vnd = report.totals?.find((t) => t.currency === 'VND');
    expect(vnd?.total).toBe(1500000);
    expect(vnd?.paid).toBe(500000);
  });

  it('does not mix currencies — one totals row each for VND and USD', () => {
    const report = invoicesToRevenueReport([
      buildInvoice({ total: 1000000 as never, currency: 'VND' as never }),
      buildInvoice({ total: 50 as never, currency: 'USD' as never }),
    ]);
    expect(report.totals).toHaveLength(2);
    expect(report.totals?.find((t) => t.currency === 'VND')?.total).toBe(
      1000000,
    );
    expect(report.totals?.find((t) => t.currency === 'USD')?.total).toBe(50);
  });
});
