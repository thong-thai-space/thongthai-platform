import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { Paragraph, Table } from 'docx';
import {
  coverPage,
  sectionHeading,
  styledTable,
  keyValueRow,
  defaultStyles,
  defaultFooter,
  type PdfMeta,
} from '../pdf.renderer';
import {
  docxHeading,
  docxParagraph,
  docxTable,
  type DocxMeta,
} from '../docx.renderer';
import type { XlsxSheet } from '../xlsx.renderer';

export interface EstimateContent {
  phases: { name: string; hours: number; description: string }[];
  totalHours: number;
  estimatedCost: {
    vnd: { min: number; max: number };
    usd: { min: number; max: number };
  };
  timeline: string;
}

function fmtVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
}

function fmtUSD(n: number): string {
  return '$' + new Intl.NumberFormat('en-US').format(n);
}

// --------------- PDF ---------------

export function estimatePdf(
  content: EstimateContent,
  meta: PdfMeta,
): TDocumentDefinitions {
  const isVi = meta.locale === 'VI';
  const body: Content[] = [
    sectionHeading(isVi ? 'Tổng Quan Dự Toán' : 'Estimate Summary', 1),
    keyValueRow(isVi ? 'Tổng giờ' : 'Total Hours', `${content.totalHours}h`),
    keyValueRow(isVi ? 'Thời gian dự kiến' : 'Timeline', content.timeline),
    keyValueRow(
      isVi ? 'Chi phí (VND)' : 'Cost (VND)',
      `${fmtVND(content.estimatedCost.vnd.min)} — ${fmtVND(content.estimatedCost.vnd.max)}`,
    ),
    keyValueRow(
      isVi ? 'Chi phí (USD)' : 'Cost (USD)',
      `${fmtUSD(content.estimatedCost.usd.min)} — ${fmtUSD(content.estimatedCost.usd.max)}`,
    ),
    { text: '', margin: [0, 10, 0, 0] },
    sectionHeading(isVi ? 'Chi Tiết Từng Phase' : 'Phase Breakdown', 1),
    styledTable(
      [isVi ? 'Giai đoạn' : 'Phase', isVi ? 'Mô tả' : 'Description', isVi ? 'Giờ' : 'Hours'],
      content.phases.map((p) => [p.name, p.description, `${p.hours}h`]),
      ['*', '*', 60],
    ),
  ];

  return {
    content: [...coverPage(meta), ...body],
    styles: defaultStyles,
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.4 },
    footer: defaultFooter(meta) as any,
    pageMargins: [40, 60, 40, 50],
  };
}

// --------------- DOCX ---------------

export function estimateDocx(
  content: EstimateContent,
  meta: DocxMeta,
): (Paragraph | Table)[] {
  const isVi = meta.locale === 'VI';
  const paragraphs: (Paragraph | Table)[] = [];

  paragraphs.push(docxHeading(isVi ? 'Tổng Quan Dự Toán' : 'Estimate Summary', 1));
  paragraphs.push(docxParagraph(`${isVi ? 'Tổng giờ' : 'Total Hours'}: ${content.totalHours}h`, { bold: true }));
  paragraphs.push(docxParagraph(`${isVi ? 'Thời gian' : 'Timeline'}: ${content.timeline}`));
  paragraphs.push(docxParagraph(`${isVi ? 'Chi phí VND' : 'Cost VND'}: ${fmtVND(content.estimatedCost.vnd.min)} — ${fmtVND(content.estimatedCost.vnd.max)}`));
  paragraphs.push(docxParagraph(`${isVi ? 'Chi phí USD' : 'Cost USD'}: ${fmtUSD(content.estimatedCost.usd.min)} — ${fmtUSD(content.estimatedCost.usd.max)}`));

  paragraphs.push(docxHeading(isVi ? 'Chi Tiết Từng Phase' : 'Phase Breakdown', 1));
  paragraphs.push(
    docxTable(
      [isVi ? 'Giai đoạn' : 'Phase', isVi ? 'Mô tả' : 'Description', isVi ? 'Giờ' : 'Hours'],
      content.phases.map((p) => [p.name, p.description, `${p.hours}h`]),
    ),
  );

  return paragraphs;
}

// --------------- XLSX ---------------

export function estimateXlsx(
  content: EstimateContent,
  meta: { locale: string },
): XlsxSheet[] {
  const isVi = meta.locale === 'VI';
  return [
    {
      name: isVi ? 'Tổng Quan' : 'Summary',
      headers: [isVi ? 'Chỉ số' : 'Metric', isVi ? 'Giá trị' : 'Value'],
      rows: [
        [isVi ? 'Tổng giờ' : 'Total Hours', content.totalHours],
        [isVi ? 'Thời gian' : 'Timeline', content.timeline],
        [isVi ? 'Chi phí VND (min)' : 'Cost VND (min)', content.estimatedCost.vnd.min],
        [isVi ? 'Chi phí VND (max)' : 'Cost VND (max)', content.estimatedCost.vnd.max],
        [isVi ? 'Chi phí USD (min)' : 'Cost USD (min)', content.estimatedCost.usd.min],
        [isVi ? 'Chi phí USD (max)' : 'Cost USD (max)', content.estimatedCost.usd.max],
      ],
    },
    {
      name: isVi ? 'Chi Tiết Phase' : 'Phase Details',
      headers: [isVi ? 'Giai đoạn' : 'Phase', isVi ? 'Mô tả' : 'Description', isVi ? 'Giờ' : 'Hours'],
      rows: content.phases.map((p) => [p.name, p.description, p.hours]),
      columnFormats: { 2: '#,##0' },
    },
  ];
}
