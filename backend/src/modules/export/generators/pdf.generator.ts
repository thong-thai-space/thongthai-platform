import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { ExportGenerator } from './export-generator';
import type {
  PdfDocumentPayload,
  PdfTableColumn,
} from '../templates/document.types';

// Be Vietnam Pro is embedded so Vietnamese diacritics render correctly — the
// built-in Helvetica (WinAnsi) cannot represent characters like ệ, ạ, ữ.
// Resolve the asset dir defensively: `__dirname/../assets/fonts` covers both
// ts-node (src) and the compiled build; the extra candidate guards against
// deploy layouts where assets land beside the source tree.
function resolveFontDir(): string {
  const candidates = [
    join(__dirname, '..', 'assets', 'fonts'),
    join(process.cwd(), 'dist', 'src', 'modules', 'export', 'assets', 'fonts'),
    join(process.cwd(), 'src', 'modules', 'export', 'assets', 'fonts'),
  ];
  return candidates.find((dir) => existsSync(dir)) ?? candidates[0];
}

const FONT_DIR = resolveFontDir();
const FONT_REGULAR = join(FONT_DIR, 'BeVietnamPro-Regular.ttf');
const FONT_BOLD = join(FONT_DIR, 'BeVietnamPro-SemiBold.ttf');

const PAGE_MARGIN = 50;
const TEXT = '#1e293b';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const HEAD_BG = '#f1f5f9';

/**
 * Pattern: Strategy — the PDF arm of the export generator family. Renders a
 * normalized PdfDocumentPayload (header, parties, line-item table, totals,
 * notes) into a self-contained PDF buffer.
 */
@Injectable()
export class PdfGenerator implements ExportGenerator {
  async generate(payload: Record<string, unknown>): Promise<Buffer> {
    const doc = payload as unknown as PdfDocumentPayload;
    const pdf = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });

    pdf.registerFont('body', FONT_REGULAR);
    pdf.registerFont('bold', FONT_BOLD);
    pdf.font('body').fillColor(TEXT);

    const chunks: Buffer[] = [];
    pdf.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) =>
      pdf.on('end', () => resolve(Buffer.concat(chunks))),
    );

    this.drawHeader(pdf, doc);
    this.drawInfoBlocks(pdf, doc);
    if (doc.table) this.drawTable(pdf, doc.table.columns, doc.table.rows);
    if (doc.totals?.length) this.drawTotals(pdf, doc.totals);
    this.drawNotesAndFooter(pdf, doc);

    pdf.end();
    return done;
  }

  private contentWidth(pdf: PDFKit.PDFDocument): number {
    return pdf.page.width - PAGE_MARGIN * 2;
  }

  private drawHeader(pdf: PDFKit.PDFDocument, doc: PdfDocumentPayload): void {
    const top = PAGE_MARGIN;
    if (doc.brand) {
      pdf
        .font('bold')
        .fontSize(15)
        .fillColor(TEXT)
        .text(doc.brand, PAGE_MARGIN, top);
    }

    // Title + subtitle + meta, right-aligned.
    const width = this.contentWidth(pdf);
    pdf
      .font('bold')
      .fontSize(22)
      .fillColor(TEXT)
      .text(doc.title, PAGE_MARGIN, top, { width, align: 'right' });
    if (doc.subtitle) {
      pdf
        .font('body')
        .fontSize(10)
        .fillColor(MUTED)
        .text(doc.subtitle, PAGE_MARGIN, pdf.y + 2, { width, align: 'right' });
    }
    for (const m of doc.meta ?? []) {
      pdf
        .font('body')
        .fontSize(9)
        .fillColor(MUTED)
        .text(`${m.label}: ${m.value}`, PAGE_MARGIN, pdf.y + 2, {
          width,
          align: 'right',
        });
    }
    pdf.moveDown(1.5);
  }

  private drawInfoBlocks(
    pdf: PDFKit.PDFDocument,
    doc: PdfDocumentPayload,
  ): void {
    const blocks = doc.infoBlocks ?? [];
    if (!blocks.length) return;

    const startY = pdf.y + 8;
    const colWidth = this.contentWidth(pdf) / blocks.length;
    let maxY = startY;

    blocks.forEach((block, i) => {
      const x = PAGE_MARGIN + i * colWidth;
      pdf
        .font('bold')
        .fontSize(9)
        .fillColor(MUTED)
        .text(block.heading.toUpperCase(), x, startY, { width: colWidth - 10 });
      pdf.font('body').fontSize(10).fillColor(TEXT);
      for (const line of block.lines) {
        pdf.text(line, x, pdf.y + 1, { width: colWidth - 10 });
      }
      maxY = Math.max(maxY, pdf.y);
    });

    pdf.y = maxY;
    pdf.moveDown(1.5);
  }

  private drawTable(
    pdf: PDFKit.PDFDocument,
    columns: PdfTableColumn[],
    rows: Record<string, string | number>[],
  ): void {
    const totalWeight = columns.reduce((s, c) => s + c.width, 0);
    const available = this.contentWidth(pdf);
    const widths = columns.map((c) => (c.width / totalWeight) * available);
    const xs: number[] = [];
    columns.reduce((x, _c, i) => {
      xs[i] = x;
      return x + widths[i];
    }, PAGE_MARGIN);

    const cell = (text: string, i: number, y: number, bold = false) =>
      pdf
        .font(bold ? 'bold' : 'body')
        .fontSize(9)
        .text(text, xs[i] + 4, y, {
          width: widths[i] - 8,
          align: columns[i].align ?? 'left',
        });

    // Header row.
    let y = pdf.y;
    const headerH = 20;
    pdf.rect(PAGE_MARGIN, y, available, headerH).fill(HEAD_BG);
    pdf.fillColor(TEXT);
    columns.forEach((c, i) => cell(c.header, i, y + 6, true));
    y += headerH;

    // Body rows.
    pdf.fillColor(TEXT);
    for (const row of rows) {
      const heights = columns.map((c, i) =>
        pdf
          .font('body')
          .fontSize(9)
          .heightOfString(String(row[c.key] ?? ''), { width: widths[i] - 8 }),
      );
      const rowH = Math.max(16, ...heights) + 8;

      if (y + rowH > pdf.page.height - PAGE_MARGIN) {
        pdf.addPage();
        y = PAGE_MARGIN;
      }

      columns.forEach((c, i) => cell(String(row[c.key] ?? ''), i, y + 4));
      pdf
        .moveTo(PAGE_MARGIN, y + rowH)
        .lineTo(PAGE_MARGIN + available, y + rowH)
        .strokeColor(LINE)
        .lineWidth(0.5)
        .stroke();
      y += rowH;
    }

    pdf.y = y + 6;
  }

  private drawTotals(
    pdf: PDFKit.PDFDocument,
    totals: NonNullable<PdfDocumentPayload['totals']>,
  ): void {
    const boxWidth = 240;
    const x = pdf.page.width - PAGE_MARGIN - boxWidth;
    let y = pdf.y + 6;

    for (const t of totals) {
      const bold = !!t.emphasize;
      pdf
        .font(bold ? 'bold' : 'body')
        .fontSize(bold ? 11 : 10)
        .fillColor(bold ? TEXT : MUTED)
        .text(t.label, x, y, { width: boxWidth / 2 });
      pdf
        .font(bold ? 'bold' : 'body')
        .fontSize(bold ? 11 : 10)
        .fillColor(TEXT)
        .text(t.value, x + boxWidth / 2, y, {
          width: boxWidth / 2,
          align: 'right',
        });
      y = pdf.y + 4;
    }
    pdf.y = y;
  }

  private drawNotesAndFooter(
    pdf: PDFKit.PDFDocument,
    doc: PdfDocumentPayload,
  ): void {
    if (doc.notes) {
      pdf.moveDown(1.5);
      pdf.font('bold').fontSize(9).fillColor(MUTED).text('NOTES');
      pdf
        .font('body')
        .fontSize(9)
        .fillColor(TEXT)
        .text(doc.notes, { width: this.contentWidth(pdf) });
    }
    if (doc.footer) {
      pdf
        .font('body')
        .fontSize(8)
        .fillColor(MUTED)
        .text(doc.footer, PAGE_MARGIN, pdf.page.height - PAGE_MARGIN + 5, {
          width: this.contentWidth(pdf),
          align: 'center',
        });
    }
  }
}
