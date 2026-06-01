import { Invoice } from '@prisma/client';
import type { InvoiceWithRelations } from '../domain/invoice.repository.port';
import type {
  PdfDocumentPayload,
  XlsxDocumentPayload,
} from '../../export/templates/document.types';

// Pattern: Pure mapper — turns invoice domain objects into the format-agnostic
// document payloads the export generators render. No I/O, fully unit-testable.

const BRAND = 'Thông Thái Space';

/** Decimal | number | string → grouped string; VND has no minor units, USD has 2. */
export function formatMoney(
  value: { toString(): string } | number | string | null | undefined,
  currency: string,
): string {
  const num = Number(value ?? 0);
  const digits = currency === 'USD' ? 2 : 0;
  const formatted = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(num) ? num : 0);
  return `${formatted} ${currency}`;
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/** A safe filename like `invoice-INV-2026-001.pdf`. */
export function invoicePdfFilename(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `invoice-${safe}.pdf`;
}

export function invoiceToPdfDocument(
  invoice: InvoiceWithRelations,
): PdfDocumentPayload {
  const currency = invoice.currency;

  return {
    title: 'HÓA ĐƠN',
    subtitle: invoice.invoiceNumber,
    brand: BRAND,
    meta: [
      { label: 'Ngày lập', value: formatDate(invoice.issueDate) },
      { label: 'Hạn thanh toán', value: formatDate(invoice.dueDate) },
      { label: 'Trạng thái', value: invoice.status },
    ],
    infoBlocks: [
      {
        heading: 'Bên cung cấp',
        lines: [
          BRAND,
          invoice.creator?.name ?? '',
          invoice.creator?.email ?? '',
        ].filter(Boolean),
      },
      {
        heading: 'Khách hàng',
        lines: [
          invoice.client?.name ?? '',
          invoice.client?.email ?? '',
          invoice.client?.phone ?? '',
        ].filter(Boolean),
      },
    ],
    table: {
      columns: [
        { header: 'Mô tả', key: 'description', width: 5 },
        { header: 'SL', key: 'quantity', align: 'right', width: 1 },
        { header: 'Đơn giá', key: 'unitPrice', align: 'right', width: 2 },
        { header: 'Thành tiền', key: 'amount', align: 'right', width: 2 },
      ],
      rows: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: formatMoney(item.unitPrice, currency),
        amount: formatMoney(item.amount, currency),
      })),
    },
    totals: [
      { label: 'Tạm tính', value: formatMoney(invoice.subtotal, currency) },
      ...(Number(invoice.discount) > 0
        ? [
            {
              label: 'Giảm giá',
              value: `- ${formatMoney(invoice.discount, currency)}`,
            },
          ]
        : []),
      ...(Number(invoice.tax) > 0
        ? [{ label: 'Thuế', value: formatMoney(invoice.tax, currency) }]
        : []),
      {
        label: 'Tổng cộng',
        value: formatMoney(invoice.total, currency),
        emphasize: true,
      },
    ],
    notes: invoice.notes ?? undefined,
    footer: `${BRAND} · Hóa đơn ${invoice.invoiceNumber}`,
  };
}

/** Builds a revenue spreadsheet from a flat list of invoices. */
export function invoicesToRevenueReport(
  invoices: Invoice[],
): XlsxDocumentPayload {
  const rows = invoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    issueDate: formatDate(inv.issueDate),
    status: inv.status,
    currency: inv.currency,
    total: Number(inv.total),
    paid: inv.paidAt ? Number(inv.paidAmount ?? inv.total) : 0,
  }));

  const sum = (key: 'total' | 'paid') =>
    rows.reduce((acc, r) => acc + r[key], 0);

  return {
    sheetName: 'Doanh thu',
    title: `Báo cáo doanh thu — ${rows.length} hóa đơn`,
    columns: [
      { header: 'Số hóa đơn', key: 'invoiceNumber', width: 18 },
      { header: 'Ngày lập', key: 'issueDate', width: 14 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Tiền tệ', key: 'currency', width: 10 },
      { header: 'Tổng tiền', key: 'total', width: 18, numeric: true },
      { header: 'Đã thu', key: 'paid', width: 18, numeric: true },
    ],
    rows,
    totals: {
      invoiceNumber: 'TỔNG',
      total: sum('total'),
      paid: sum('paid'),
    },
  };
}
