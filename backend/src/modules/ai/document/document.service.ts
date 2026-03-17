import { Injectable, BadRequestException } from '@nestjs/common';
import { buildPdfBuffer, type PdfMeta } from './pdf.renderer';
import { buildDocxBuffer, type DocxMeta } from './docx.renderer';
import { buildXlsxBuffer, type XlsxMeta } from './xlsx.renderer';

import { proposalPdf, proposalDocx, proposalXlsx, type ProposalContent } from './templates/proposal.template';
import { progressReportPdf, progressReportDocx, progressReportXlsx, type ProgressReportContent } from './templates/progress-report.template';
import { estimatePdf, estimateDocx, estimateXlsx, type EstimateContent } from './templates/estimate.template';
import { taskBreakdownPdf, taskBreakdownDocx, taskBreakdownXlsx, type TaskBreakdownContent } from './templates/task-breakdown.template';
import { strategicPlanPdf, strategicPlanDocx, strategicPlanXlsx, type StrategicPlanContent } from './templates/strategic-plan.template';

export type ExportFeature =
  | 'proposal'
  | 'progress-report'
  | 'estimate'
  | 'task-breakdown'
  | 'strategic-plan';

export type ExportFormat = 'pdf' | 'docx' | 'xlsx';

export interface ExportMeta {
  locale: string;
  projectName?: string;
  userName?: string;
}

export interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

const MIME_TYPES: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const FEATURE_LABELS: Record<ExportFeature, { vi: string; en: string }> = {
  proposal: { vi: 'Đề Xuất Dự Án', en: 'Project Proposal' },
  'progress-report': { vi: 'Báo Cáo Tiến Độ', en: 'Progress Report' },
  estimate: { vi: 'Dự Toán Chi Phí', en: 'Cost Estimate' },
  'task-breakdown': { vi: 'Phân Rã Công Việc', en: 'Task Breakdown' },
  'strategic-plan': { vi: 'Kế Hoạch Chiến Lược', en: 'Strategic Plan' },
};

@Injectable()
export class DocumentService {
  async generate(
    feature: ExportFeature,
    format: ExportFormat,
    content: unknown,
    meta: ExportMeta,
  ): Promise<ExportResult> {
    if (!MIME_TYPES[format]) {
      throw new BadRequestException(`Unsupported format: ${format}`);
    }
    if (!FEATURE_LABELS[feature]) {
      throw new BadRequestException(`Unsupported feature: ${feature}`);
    }

    const isVi = meta.locale === 'VI';
    const featureLabel = isVi ? FEATURE_LABELS[feature].vi : FEATURE_LABELS[feature].en;
    const dateStr = new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US');

    const pdfMeta: PdfMeta = {
      title: featureLabel,
      subtitle: meta.projectName,
      locale: meta.locale,
      generatedBy: meta.userName,
      date: dateStr,
    };

    const docxMeta: DocxMeta = {
      title: featureLabel,
      subtitle: meta.projectName,
      locale: meta.locale,
      generatedBy: meta.userName,
      date: dateStr,
    };

    const xlsxMeta: XlsxMeta = {
      title: `${featureLabel}${meta.projectName ? ' — ' + meta.projectName : ''}`,
      locale: meta.locale,
      generatedBy: meta.userName,
    };

    const buffer = await this.dispatch(feature, format, content, pdfMeta, docxMeta, xlsxMeta);

    const safeName = (meta.projectName || featureLabel)
      .toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      buffer,
      mimeType: MIME_TYPES[format],
      filename: `${safeName}-${feature}.${format}`,
    };
  }

  private async dispatch(
    feature: ExportFeature,
    format: ExportFormat,
    content: unknown,
    pdfMeta: PdfMeta,
    docxMeta: DocxMeta,
    xlsxMeta: XlsxMeta,
  ): Promise<Buffer> {
    switch (feature) {
      case 'proposal':
        return this.renderProposal(format, content as ProposalContent, pdfMeta, docxMeta, xlsxMeta);
      case 'progress-report':
        return this.renderProgressReport(format, content as ProgressReportContent, pdfMeta, docxMeta, xlsxMeta);
      case 'estimate':
        return this.renderEstimate(format, content as EstimateContent, pdfMeta, docxMeta, xlsxMeta);
      case 'task-breakdown':
        return this.renderTaskBreakdown(format, content as TaskBreakdownContent, pdfMeta, docxMeta, xlsxMeta);
      case 'strategic-plan':
        return this.renderStrategicPlan(format, content as StrategicPlanContent, pdfMeta, docxMeta, xlsxMeta);
      default:
        throw new BadRequestException(`Unsupported feature: ${feature}`);
    }
  }

  private async renderProposal(
    format: ExportFormat,
    content: ProposalContent,
    pdfMeta: PdfMeta,
    docxMeta: DocxMeta,
    xlsxMeta: XlsxMeta,
  ): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return buildPdfBuffer(proposalPdf(content, pdfMeta));
      case 'docx':
        return buildDocxBuffer(docxMeta, proposalDocx(content, docxMeta));
      case 'xlsx':
        return buildXlsxBuffer(xlsxMeta, proposalXlsx(content, { locale: xlsxMeta.locale }));
    }
  }

  private async renderProgressReport(
    format: ExportFormat,
    content: ProgressReportContent,
    pdfMeta: PdfMeta,
    docxMeta: DocxMeta,
    xlsxMeta: XlsxMeta,
  ): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return buildPdfBuffer(progressReportPdf(content, pdfMeta));
      case 'docx':
        return buildDocxBuffer(docxMeta, progressReportDocx(content, docxMeta));
      case 'xlsx':
        return buildXlsxBuffer(xlsxMeta, progressReportXlsx(content, { locale: xlsxMeta.locale }));
    }
  }

  private async renderEstimate(
    format: ExportFormat,
    content: EstimateContent,
    pdfMeta: PdfMeta,
    docxMeta: DocxMeta,
    xlsxMeta: XlsxMeta,
  ): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return buildPdfBuffer(estimatePdf(content, pdfMeta));
      case 'docx':
        return buildDocxBuffer(docxMeta, estimateDocx(content, docxMeta));
      case 'xlsx':
        return buildXlsxBuffer(xlsxMeta, estimateXlsx(content, { locale: xlsxMeta.locale }));
    }
  }

  private async renderTaskBreakdown(
    format: ExportFormat,
    content: TaskBreakdownContent,
    pdfMeta: PdfMeta,
    docxMeta: DocxMeta,
    xlsxMeta: XlsxMeta,
  ): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return buildPdfBuffer(taskBreakdownPdf(content, pdfMeta));
      case 'docx':
        return buildDocxBuffer(docxMeta, taskBreakdownDocx(content, docxMeta));
      case 'xlsx':
        return buildXlsxBuffer(xlsxMeta, taskBreakdownXlsx(content, { locale: xlsxMeta.locale }));
    }
  }

  private async renderStrategicPlan(
    format: ExportFormat,
    content: StrategicPlanContent,
    pdfMeta: PdfMeta,
    docxMeta: DocxMeta,
    xlsxMeta: XlsxMeta,
  ): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return buildPdfBuffer(strategicPlanPdf(content, pdfMeta));
      case 'docx':
        return buildDocxBuffer(docxMeta, strategicPlanDocx(content, docxMeta));
      case 'xlsx':
        return buildXlsxBuffer(xlsxMeta, strategicPlanXlsx(content, { locale: xlsxMeta.locale }));
    }
  }
}
