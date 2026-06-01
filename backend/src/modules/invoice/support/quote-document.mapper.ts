import { QuoteDto } from '../dto/quote.dto';
import type { PdfDocumentPayload } from '../../export/templates/document.types';
import { formatDate, formatMoney } from './invoice-document.mapper';

// Pattern: Pure mapper — turns a quote request into a renderable document and
// computes its totals. No I/O, no persistence; fully unit-testable.

const BRAND = 'Thông Thái Space';

export interface QuoteTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

/** Recomputes a quote's money fields from its line items (server is the source of truth). */
export function computeQuoteTotals(quote: QuoteDto): QuoteTotals {
  const subtotal = quote.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );
  const discount = quote.discount ?? 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round((taxable * (quote.taxRate ?? 0)) / 100);
  const total = taxable + tax;
  return { subtotal, tax, discount, total };
}

export function quotePdfFilename(clientName: string): string {
  const safe = clientName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[đĐ]/g, 'd') // đ/Đ aren't decomposed by NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // runs of other chars → single hyphen
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  const stamp = new Date().toISOString().slice(0, 10);
  return `quote-${safe || 'client'}-${stamp}.pdf`;
}

export function quoteToPdfDocument(quote: QuoteDto): PdfDocumentPayload {
  const currency = quote.currency ?? 'VND';
  const totals = computeQuoteTotals(quote);

  return {
    title: 'BÁO GIÁ',
    subtitle: `Ngày ${formatDate(new Date())}`,
    brand: BRAND,
    meta: [
      ...(quote.validUntil
        ? [{ label: 'Hiệu lực đến', value: formatDate(quote.validUntil) }]
        : []),
    ],
    infoBlocks: [
      {
        heading: 'Bên cung cấp',
        lines: [BRAND, 'thongthaispace.com'],
      },
      {
        heading: 'Khách hàng',
        lines: [
          quote.clientName,
          quote.clientEmail ?? '',
          quote.clientPhone ?? '',
        ].filter(Boolean),
      },
    ],
    table: {
      columns: [
        { header: 'Hạng mục', key: 'description', width: 5 },
        { header: 'SL', key: 'quantity', align: 'right', width: 1 },
        { header: 'Đơn giá', key: 'unitPrice', align: 'right', width: 2 },
        { header: 'Thành tiền', key: 'amount', align: 'right', width: 2 },
      ],
      rows: quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: formatMoney(item.unitPrice, currency),
        amount: formatMoney(item.quantity * item.unitPrice, currency),
      })),
    },
    totals: [
      { label: 'Tạm tính', value: formatMoney(totals.subtotal, currency) },
      ...(totals.discount > 0
        ? [
            {
              label: 'Giảm giá',
              value: `- ${formatMoney(totals.discount, currency)}`,
            },
          ]
        : []),
      ...(totals.tax > 0
        ? [{ label: 'Thuế', value: formatMoney(totals.tax, currency) }]
        : []),
      {
        label: 'Tổng cộng',
        value: formatMoney(totals.total, currency),
        emphasize: true,
      },
    ],
    notes: quote.introNote ?? undefined,
    footer: `${BRAND} · Báo giá có hiệu lực theo thỏa thuận`,
  };
}
