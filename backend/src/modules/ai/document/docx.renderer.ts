import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  PageBreak,
  Tab,
  TabStopType,
  TabStopPosition,
} from 'docx';

const COLORS = {
  primary: '2563EB',
  headerBg: '1E40AF',
  lightBg: 'F3F4F6',
  white: 'FFFFFF',
  muted: '6B7280',
  success: '16A34A',
  danger: 'DC2626',
  accent: 'F59E0B',
};

export interface DocxMeta {
  title: string;
  subtitle?: string;
  locale: string;
  generatedBy?: string;
  date?: string;
}

export function buildDocxBuffer(
  meta: DocxMeta,
  bodyContent: (Paragraph | Table)[],
): Promise<Buffer> {
  const dateStr =
    meta.date ||
    new Date().toLocaleDateString(
      meta.locale === 'VI' ? 'vi-VN' : 'en-US',
    );

  const doc = new Document({
    creator: 'Thông Thái Space',
    title: meta.title,
    description: meta.subtitle || '',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
          paragraph: { spacing: { after: 120 } },
        },
        heading1: {
          run: { font: 'Calibri', size: 32, bold: true, color: COLORS.primary },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        heading2: {
          run: { font: 'Calibri', size: 26, bold: true, color: '1F2937' },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
        heading3: {
          run: { font: 'Calibri', size: 24, bold: true, color: '374151' },
          paragraph: { spacing: { before: 160, after: 80 } },
        },
      },
    },
    sections: [
      // Cover page
      {
        properties: {
          page: {
            pageNumbers: { start: 0 },
          },
        },
        children: [
          new Paragraph({ spacing: { before: 3000 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'THÔNG THÁI SPACE',
                bold: true,
                size: 44,
                color: COLORS.primary,
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Web & App Development • AI Solutions',
                italics: true,
                size: 22,
                color: COLORS.muted,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: meta.title,
                bold: true,
                size: 52,
                color: '111827',
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          ...(meta.subtitle
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: meta.subtitle,
                      size: 28,
                      color: COLORS.muted,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 800 },
                }),
              ]
            : [new Paragraph({ spacing: { after: 800 } })]),
          new Paragraph({
            children: [
              new TextRun({
                text: `${meta.locale === 'VI' ? 'Ngày tạo' : 'Date'}: ${dateStr}`,
                size: 20,
                color: COLORS.muted,
              }),
              ...(meta.generatedBy
                ? [
                    new TextRun({
                      text: `    |    ${meta.locale === 'VI' ? 'Người tạo' : 'By'}: ${meta.generatedBy}`,
                      size: 20,
                      color: COLORS.muted,
                    }),
                  ]
                : []),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new PageBreak()],
          }),
        ],
      },
      // Body
      {
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Thông Thái Space',
                    size: 16,
                    color: COLORS.muted,
                    italics: true,
                  }),
                  new TextRun({
                    children: [new Tab(), meta.title],
                    size: 16,
                    color: COLORS.muted,
                  }),
                ],
                tabStops: [
                  {
                    type: TabStopType.RIGHT,
                    position: TabStopPosition.MAX,
                  },
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${meta.locale === 'VI' ? 'Trang' : 'Page'} `,
                    size: 16,
                    color: COLORS.muted,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLORS.muted,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: bodyContent,
      },
    ],
  });

  return Packer.toBuffer(doc) as Promise<Buffer>;
}

export function docxHeading(text: string, level: 1 | 2 | 3 = 1): Paragraph {
  const headingMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({ text, heading: headingMap[level] });
}

export function docxParagraph(text: string, options?: { bold?: boolean; color?: string; size?: number }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        color: options?.color,
        size: options?.size || 22,
      }),
    ],
  });
}

export function docxBulletList(items: string[]): Paragraph[] {
  return items.map(
    (item) =>
      new Paragraph({
        children: [new TextRun({ text: item, size: 22 })],
        bullet: { level: 0 },
      }),
  );
}

const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: 'E5E7EB',
};

const allBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};

export function docxTable(
  headers: string[],
  rows: string[][],
  widths?: number[],
): Table {
  const defaultWidth = Math.floor(9000 / headers.length);
  const colWidths = widths || headers.map(() => defaultWidth);

  return new Table({
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (h, i) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: h,
                      bold: true,
                      color: COLORS.white,
                      size: 20,
                    }),
                  ],
                }),
              ],
              width: { size: colWidths[i], type: WidthType.DXA },
              shading: {
                type: ShadingType.SOLID,
                color: COLORS.headerBg,
                fill: COLORS.headerBg,
              },
              borders: allBorders,
            }),
        ),
      }),
      ...rows.map(
        (row, rowIdx) =>
          new TableRow({
            children: row.map(
              (cell, colIdx) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: cell, size: 20 })],
                    }),
                  ],
                  width: { size: colWidths[colIdx], type: WidthType.DXA },
                  shading:
                    rowIdx % 2 === 1
                      ? { type: ShadingType.SOLID, color: COLORS.lightBg, fill: COLORS.lightBg }
                      : undefined,
                  borders: allBorders,
                }),
            ),
          }),
      ),
    ],
    width: { size: 9000, type: WidthType.DXA },
  });
}
