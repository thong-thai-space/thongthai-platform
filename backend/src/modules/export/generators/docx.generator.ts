import { Injectable } from '@nestjs/common';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { ExportGenerator } from './export-generator';
import type {
  PdfDocumentPayload,
  PdfTableColumn,
} from '../templates/document.types';

const TEXT = '1E293B';
const MUTED = '64748B';
const HEAD_BG = 'F1F5F9';
const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF',
} as const;
const NONE_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
} as const;

/**
 * Pattern: Strategy — the DOCX arm of the export generator family. Renders the
 * same normalized PdfDocumentPayload as the PDF generator (header, parties,
 * line-item table, totals, notes) into a Word document, so any document (quote,
 * proposal, contract) can be exported as an editable .docx. Vietnamese renders
 * natively — Word ships Unicode fonts.
 */
@Injectable()
export class DocxGenerator implements ExportGenerator {
  async generate(payload: Record<string, unknown>): Promise<Buffer> {
    const doc = payload as unknown as PdfDocumentPayload;

    const children: (Paragraph | Table)[] = [
      ...this.header(doc),
      ...this.infoBlocks(doc),
      ...(doc.table
        ? [this.table(doc.table.columns, doc.table.rows), this.spacer()]
        : []),
      ...this.totals(doc),
      ...this.notes(doc),
    ];

    const document = new Document({
      sections: [
        {
          properties: {},
          children,
          footers: doc.footer
            ? { default: new Footer({ children: [this.footer(doc.footer)] }) }
            : undefined,
        },
      ],
    });

    return Packer.toBuffer(document);
  }

  private spacer(): Paragraph {
    return new Paragraph({ children: [], spacing: { after: 120 } });
  }

  private header(doc: PdfDocumentPayload): Paragraph[] {
    const out: Paragraph[] = [];
    if (doc.brand) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: doc.brand, bold: true, size: 26, color: TEXT }),
          ],
        }),
      );
    }
    out.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: doc.title, bold: true, size: 40, color: TEXT }),
        ],
      }),
    );
    if (doc.subtitle) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: doc.subtitle, size: 20, color: MUTED }),
          ],
        }),
      );
    }
    for (const m of doc.meta ?? []) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `${m.label}: ${m.value}`,
              size: 18,
              color: MUTED,
            }),
          ],
        }),
      );
    }
    out.push(this.spacer());
    return out;
  }

  private infoBlocks(doc: PdfDocumentPayload): (Paragraph | Table)[] {
    const blocks = doc.infoBlocks ?? [];
    if (!blocks.length) return [];

    const width = Math.floor(100 / blocks.length);
    const row = new TableRow({
      children: blocks.map(
        (block) =>
          new TableCell({
            width: { size: width, type: WidthType.PERCENTAGE },
            borders: NONE_BORDERS,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: block.heading.toUpperCase(),
                    bold: true,
                    size: 18,
                    color: MUTED,
                  }),
                ],
              }),
              ...block.lines.map(
                (line) =>
                  new Paragraph({
                    children: [
                      new TextRun({ text: line, size: 20, color: TEXT }),
                    ],
                  }),
              ),
            ],
          }),
      ),
    });

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NONE_BORDERS,
        rows: [row],
      }),
      this.spacer(),
    ];
  }

  // Integer column percentages summing to exactly 100 (largest-remainder method),
  // so Word never sees an oversubscribed (>100%) table and keeps the proportions.
  private columnPercentages(columns: PdfTableColumn[]): number[] {
    const totalWeight = columns.reduce((s, c) => s + c.width, 0) || 1;
    const raw = columns.map((c) => (c.width / totalWeight) * 100);
    const widths = raw.map((r) => Math.max(1, Math.floor(r)));
    let remainder = 100 - widths.reduce((a, b) => a + b, 0);
    const byFrac = raw
      .map((r, i) => ({ i, frac: r - Math.floor(r) }))
      .sort((a, b) => b.frac - a.frac);
    for (let k = 0; remainder > 0 && byFrac.length; k++, remainder--) {
      widths[byFrac[k % byFrac.length].i] += 1;
    }
    return widths;
  }

  private table(
    columns: PdfTableColumn[],
    rows: Record<string, string | number>[],
  ): Table {
    const widths = this.columnPercentages(columns);
    const align = (c: PdfTableColumn) =>
      c.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT;

    const headerRow = new TableRow({
      tableHeader: true,
      children: columns.map(
        (c, i) =>
          new TableCell({
            width: { size: widths[i], type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: HEAD_BG },
            children: [
              new Paragraph({
                alignment: align(c),
                children: [
                  new TextRun({
                    text: c.header,
                    bold: true,
                    size: 18,
                    color: TEXT,
                  }),
                ],
              }),
            ],
          }),
      ),
    });

    const bodyRows = rows.map(
      (row) =>
        new TableRow({
          children: columns.map(
            (c, i) =>
              new TableCell({
                width: { size: widths[i], type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: align(c),
                    children: [
                      new TextRun({
                        text: String(row[c.key] ?? ''),
                        size: 18,
                        color: TEXT,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...bodyRows],
    });
  }

  private totals(doc: PdfDocumentPayload): Table[] {
    const totals = doc.totals ?? [];
    if (!totals.length) return [];

    const rows = totals.map(
      (t) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: NONE_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: t.label,
                      bold: !!t.emphasize,
                      size: t.emphasize ? 22 : 20,
                      color: t.emphasize ? TEXT : MUTED,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: NONE_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: t.value,
                      bold: !!t.emphasize,
                      size: t.emphasize ? 22 : 20,
                      color: TEXT,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    );

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NONE_BORDERS,
        rows,
      }),
    ];
  }

  private notes(doc: PdfDocumentPayload): Paragraph[] {
    if (!doc.notes) return [];
    return [
      new Paragraph({
        spacing: { before: 240 },
        children: [
          new TextRun({ text: 'NOTES', bold: true, size: 18, color: MUTED }),
        ],
      }),
      new Paragraph({
        children: [new TextRun({ text: doc.notes, size: 18, color: TEXT })],
      }),
    ];
  }

  private footer(text: string): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, size: 16, color: MUTED })],
    });
  }
}
