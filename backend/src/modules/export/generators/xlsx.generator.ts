import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { ExportGenerator } from './export-generator';
import type { XlsxDocumentPayload } from '../templates/document.types';

/**
 * Pattern: Strategy — the XLSX arm of the export generator family. Renders a
 * normalized XlsxDocumentPayload (a single titled sheet with typed columns and
 * an optional totals row) into an .xlsx buffer.
 */
@Injectable()
export class XlsxGenerator implements ExportGenerator {
  async generate(payload: Record<string, unknown>): Promise<Buffer> {
    const doc = payload as unknown as XlsxDocumentPayload;
    const wb = new Workbook();
    wb.creator = 'Thong Thai Space';
    wb.created = new Date();

    const sheet = wb.addWorksheet(doc.sheetName || 'Sheet1');
    let headerRowIndex = 1;

    if (doc.title) {
      sheet.mergeCells(1, 1, 1, Math.max(1, doc.columns.length));
      const titleCell = sheet.getCell(1, 1);
      titleCell.value = doc.title;
      titleCell.font = { bold: true, size: 14 };
      headerRowIndex = 2;
    }

    sheet.columns = doc.columns.map((c) => ({
      key: c.key,
      width: c.width ?? 20,
    }));

    // Header row.
    const header = sheet.getRow(headerRowIndex);
    doc.columns.forEach((c, i) => {
      const cell = header.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
    });
    header.commit();

    // Body rows.
    doc.rows.forEach((row) => {
      const added = sheet.addRow(
        doc.columns.reduce<Record<string, string | number | null>>((acc, c) => {
          acc[c.key] = row[c.key] ?? (c.numeric ? 0 : '');
          return acc;
        }, {}),
      );
      doc.columns.forEach((c, i) => {
        if (c.numeric) added.getCell(i + 1).numFmt = '#,##0';
      });
    });

    // Totals rows (one per group, e.g. per currency).
    for (const totals of doc.totals ?? []) {
      const totalsRow = sheet.addRow(
        doc.columns.reduce<Record<string, string | number>>((acc, c) => {
          acc[c.key] = totals[c.key] ?? '';
          return acc;
        }, {}),
      );
      totalsRow.font = { bold: true };
      doc.columns.forEach((c, i) => {
        if (c.numeric) totalsRow.getCell(i + 1).numFmt = '#,##0';
      });
    }

    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
