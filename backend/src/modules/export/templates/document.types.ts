// Normalized, format-agnostic document description. A module (invoice, etc.)
// maps its domain object into this shape; the generators render it to PDF/XLSX.
// All monetary/number values are pre-formatted strings — formatting is the
// caller's job, rendering is the generator's.

export interface PdfInfoBlock {
  heading: string;
  lines: string[];
}

export interface PdfMetaRow {
  label: string;
  value: string;
}

export interface PdfTableColumn {
  header: string;
  key: string;
  align?: 'left' | 'right';
  /** Relative width weight (columns are laid out proportionally). */
  width: number;
}

export interface PdfTotalRow {
  label: string;
  value: string;
  emphasize?: boolean;
}

export interface PdfDocumentPayload {
  /** Large heading, e.g. "HÓA ĐƠN" / "INVOICE". */
  title: string;
  subtitle?: string;
  /** Brand line shown top-left. */
  brand?: string;
  /** Side-by-side blocks, e.g. "From" and "Bill To". */
  infoBlocks?: PdfInfoBlock[];
  /** Label/value pairs shown top-right (dates, status). */
  meta?: PdfMetaRow[];
  table?: {
    columns: PdfTableColumn[];
    rows: Record<string, string | number>[];
  };
  /** Right-aligned totals box. */
  totals?: PdfTotalRow[];
  notes?: string;
  footer?: string;
}

// ── XLSX ──

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
  /** Render this column's cells as numbers (right-aligned, summable). */
  numeric?: boolean;
}

export interface XlsxDocumentPayload {
  sheetName: string;
  title?: string;
  columns: XlsxColumn[];
  rows: Record<string, string | number | null>[];
  /** Optional footer row of pre-aggregated totals, keyed by column. */
  totals?: Record<string, string | number>;
}
