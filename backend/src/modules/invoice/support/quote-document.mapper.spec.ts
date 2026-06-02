import { QuoteDto } from '../dto/quote.dto';
import {
  computeQuoteTotals,
  quotePdfFilename,
  quoteToPdfDocument,
} from './quote-document.mapper';

function buildQuote(overrides: Partial<QuoteDto> = {}): QuoteDto {
  return {
    clientName: 'Ký túc xá Thiên Đường',
    currency: 'VND',
    items: [
      { description: 'AI Readiness Audit', quantity: 1, unitPrice: 12000000 },
      {
        description: 'Training (1 phòng ban)',
        quantity: 2,
        unitPrice: 4000000,
      },
    ],
    ...overrides,
  };
}

describe('computeQuoteTotals', () => {
  it('sums line items into a subtotal', () => {
    const totals = computeQuoteTotals(buildQuote());
    expect(totals.subtotal).toBe(20000000);
    expect(totals.total).toBe(20000000);
  });

  it('applies discount before tax', () => {
    const totals = computeQuoteTotals(
      buildQuote({ discount: 2000000, taxRate: 10 }),
    );
    // taxable = 20,000,000 - 2,000,000 = 18,000,000; tax = 1,800,000
    expect(totals.tax).toBe(1800000);
    expect(totals.total).toBe(19800000);
  });

  it('never lets discount push the taxable base below zero', () => {
    const totals = computeQuoteTotals(
      buildQuote({ discount: 999999999, taxRate: 10 }),
    );
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(0);
  });
});

describe('quoteToPdfDocument', () => {
  it('renders a BÁO GIÁ document with the client and a grand total', () => {
    const doc = quoteToPdfDocument(buildQuote());
    expect(doc.title).toBe('BÁO GIÁ');
    expect(doc.infoBlocks?.[1].lines).toContain('Ký túc xá Thiên Đường');
    expect(doc.table?.rows).toHaveLength(2);
    expect(doc.totals?.find((t) => t.emphasize)?.value).toBe('20.000.000 VND');
  });

  it('omits the validity meta row when no validUntil is given', () => {
    const doc = quoteToPdfDocument(buildQuote());
    expect(doc.meta).toEqual([]);
  });
});

describe('quotePdfFilename', () => {
  it('slugifies the (Vietnamese) client name into a safe filename', () => {
    const name = quotePdfFilename('Ký túc xá Thiên Đường');
    expect(name).toMatch(
      /^quote-ky-tuc-xa-thien-duong-\d{4}-\d{2}-\d{2}\.pdf$/,
    );
  });
});
