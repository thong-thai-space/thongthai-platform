import ExcelJS from 'exceljs';

const COLORS = {
  primary: '2563EB',
  headerBg: '1E40AF',
  lightBg: 'F3F4F6',
  white: 'FFFFFF',
  success: '16A34A',
  danger: 'DC2626',
  accent: 'F59E0B',
  muted: '6B7280',
};

export interface XlsxMeta {
  title: string;
  locale: string;
  generatedBy?: string;
}

export async function buildXlsxBuffer(
  meta: XlsxMeta,
  sheets: XlsxSheet[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Thông Thái Space';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);

    // Title row
    const titleRow = ws.addRow([meta.title]);
    titleRow.font = { size: 14, bold: true, color: { argb: 'FF' + COLORS.primary } };
    ws.mergeCells(1, 1, 1, sheet.headers.length || 1);
    ws.addRow([]);

    // Header row
    const headerRow = ws.addRow(sheet.headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + COLORS.headerBg },
      };
      cell.font = { bold: true, color: { argb: 'FF' + COLORS.white }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder();
    });

    // Data rows
    for (let i = 0; i < sheet.rows.length; i++) {
      const dataRow = ws.addRow(sheet.rows[i]);
      dataRow.eachCell((cell) => {
        cell.border = thinBorder();
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (i % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + COLORS.lightBg },
          };
        }
      });
    }

    // Auto-width columns
    for (let colIdx = 0; colIdx < sheet.headers.length; colIdx++) {
      const maxLen = Math.max(
        sheet.headers[colIdx].length,
        ...sheet.rows.map((r) => String(r[colIdx] ?? '').length),
      );
      ws.getColumn(colIdx + 1).width = Math.min(Math.max(maxLen + 4, 12), 60);
    }

    // Apply column formats
    if (sheet.columnFormats) {
      for (const [colIdx, fmt] of Object.entries(sheet.columnFormats)) {
        ws.getColumn(Number(colIdx) + 1).numFmt = fmt;
      }
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export interface XlsxSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
  columnFormats?: Record<number, string>;
}

export function priorityColor(priority: string): string {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return COLORS.danger;
    case 'MEDIUM':
      return COLORS.accent;
    case 'LOW':
      return COLORS.success;
    default:
      return COLORS.muted;
  }
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const thin: ExcelJS.Border = { style: 'thin', color: { argb: 'FFE5E7EB' } };
  return { top: thin, bottom: thin, left: thin, right: thin };
}
