import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { Paragraph, Table } from 'docx';
import {
  coverPage,
  sectionHeading,
  styledTable,
  bulletList,
  keyValueRow,
  defaultStyles,
  defaultFooter,
  type PdfMeta,
} from '../pdf.renderer';
import {
  docxHeading,
  docxParagraph,
  docxBulletList,
  docxTable,
  type DocxMeta,
} from '../docx.renderer';
import type { XlsxSheet } from '../xlsx.renderer';

export interface StrategicPlanContent {
  executiveSummary: string;
  projectHealth: {
    score: number;
    status: string;
    reasons: string[];
  };
  priorityActions: {
    title: string;
    owner: string;
    impact: string;
    timeline: string;
    details: string;
  }[];
  deliveryPlan: {
    next7Days: string[];
    next30Days: string[];
    dependencies: string[];
  };
  riskMatrix?: {
    risk: string;
    probability: string;
    severity: string;
    mitigation: string;
  }[];
  commercialInsights: {
    budgetHealth: string;
    invoiceAlerts: string[];
    costOptimization: string[];
  };
  aiAutomationOpportunities: string[];
  stakeholderUpdates: {
    forInternalTeam: string;
    forClient: string;
  };
}

function healthColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'ON_TRACK': return '#16A34A';
    case 'AT_RISK': return '#F59E0B';
    case 'OFF_TRACK': return '#DC2626';
    default: return '#6B7280';
  }
}

function impactColor(impact: string): string {
  switch (impact?.toUpperCase()) {
    case 'HIGH': return '#DC2626';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW': return '#16A34A';
    default: return '#6B7280';
  }
}

// --------------- PDF ---------------

export function strategicPlanPdf(
  content: StrategicPlanContent,
  meta: PdfMeta,
): TDocumentDefinitions {
  const isVi = meta.locale === 'VI';
  const body: Content[] = [];

  // Executive Summary
  body.push(sectionHeading(isVi ? 'Tóm Tắt Điều Hành' : 'Executive Summary', 1));
  body.push({ text: content.executiveSummary, style: 'bodyText', margin: [0, 0, 0, 10] });

  // Project Health
  body.push(sectionHeading(isVi ? 'Sức Khỏe Dự Án' : 'Project Health', 1));
  body.push({
    columns: [
      {
        width: 100,
        stack: [
          { text: `${content.projectHealth.score}/100`, fontSize: 28, bold: true, color: healthColor(content.projectHealth.status), alignment: 'center' as const },
          { text: content.projectHealth.status.replace(/_/g, ' '), fontSize: 10, color: healthColor(content.projectHealth.status), alignment: 'center' as const, bold: true },
        ],
      },
      {
        width: '*',
        ul: content.projectHealth.reasons.map((r) => ({ text: r, margin: [0, 2, 0, 2] })),
      },
    ],
    margin: [0, 5, 0, 15],
  });

  // Priority Actions
  body.push(sectionHeading(isVi ? 'Hành Động Ưu Tiên' : 'Priority Actions', 1));
  body.push(
    styledTable(
      [
        isVi ? 'Hành động' : 'Action',
        isVi ? 'Người chịu trách nhiệm' : 'Owner',
        isVi ? 'Tác động' : 'Impact',
        isVi ? 'Thời hạn' : 'Timeline',
      ],
      content.priorityActions.map((a) => [
        { stack: [{ text: a.title, bold: true }, { text: a.details, fontSize: 8, color: '#6B7280' }] },
        a.owner,
        { text: a.impact, color: impactColor(a.impact), bold: true },
        a.timeline,
      ]),
      ['*', 70, 60, 80],
    ),
  );

  // Delivery Plan
  body.push(sectionHeading(isVi ? 'Kế Hoạch Giao Hàng' : 'Delivery Plan', 1));
  body.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: isVi ? '7 Ngày Tới' : 'Next 7 Days', style: 'h3' },
          ...content.deliveryPlan.next7Days.map((item) => ({
            text: `• ${item}`,
            fontSize: 9,
            margin: [0, 2, 0, 2] as [number, number, number, number],
          })),
        ],
      },
      {
        width: '*',
        stack: [
          { text: isVi ? '30 Ngày Tới' : 'Next 30 Days', style: 'h3' },
          ...content.deliveryPlan.next30Days.map((item) => ({
            text: `• ${item}`,
            fontSize: 9,
            margin: [0, 2, 0, 2] as [number, number, number, number],
          })),
        ],
      },
    ],
    margin: [0, 5, 0, 10],
  });

  if (content.deliveryPlan.dependencies.length > 0) {
    body.push(sectionHeading(isVi ? 'Phụ Thuộc' : 'Dependencies', 2));
    body.push(bulletList(content.deliveryPlan.dependencies));
  }

  // Risk Matrix
  if (content.riskMatrix && content.riskMatrix.length > 0) {
    body.push(sectionHeading(isVi ? 'Ma Trận Rủi Ro' : 'Risk Matrix', 1));
    body.push(
      styledTable(
        [
          isVi ? 'Rủi ro' : 'Risk',
          isVi ? 'Xác suất' : 'Probability',
          isVi ? 'Mức nghiêm trọng' : 'Severity',
          isVi ? 'Giải pháp' : 'Mitigation',
        ],
        content.riskMatrix.map((r) => [
          r.risk,
          { text: r.probability, color: impactColor(r.probability), bold: true },
          { text: r.severity, color: impactColor(r.severity), bold: true },
          r.mitigation,
        ]),
        ['*', 70, 70, '*'],
      ),
    );
  }

  // Commercial Insights
  body.push(sectionHeading(isVi ? 'Thông Tin Thương Mại' : 'Commercial Insights', 1));
  body.push(keyValueRow(isVi ? 'Sức khỏe ngân sách' : 'Budget Health', content.commercialInsights.budgetHealth));
  if (content.commercialInsights.invoiceAlerts.length > 0) {
    body.push(sectionHeading(isVi ? 'Cảnh báo hóa đơn' : 'Invoice Alerts', 2));
    body.push(bulletList(content.commercialInsights.invoiceAlerts));
  }
  if (content.commercialInsights.costOptimization.length > 0) {
    body.push(sectionHeading(isVi ? 'Tối ưu chi phí' : 'Cost Optimization', 2));
    body.push(bulletList(content.commercialInsights.costOptimization));
  }

  // AI Automation
  if (content.aiAutomationOpportunities.length > 0) {
    body.push(sectionHeading(isVi ? 'Cơ Hội Tự Động Hóa AI' : 'AI Automation Opportunities', 1));
    body.push(bulletList(content.aiAutomationOpportunities));
  }

  // Stakeholder Updates
  body.push(sectionHeading(isVi ? 'Cập Nhật Cho Stakeholders' : 'Stakeholder Updates', 1));
  body.push(sectionHeading(isVi ? 'Đội ngũ nội bộ' : 'Internal Team', 2));
  body.push({ text: content.stakeholderUpdates.forInternalTeam, style: 'bodyText', margin: [0, 0, 0, 8] });
  body.push(sectionHeading(isVi ? 'Khách hàng' : 'Client', 2));
  body.push({ text: content.stakeholderUpdates.forClient, style: 'bodyText', margin: [0, 0, 0, 8] });

  return {
    content: [...coverPage(meta), ...body],
    styles: defaultStyles,
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.4 },
    footer: defaultFooter(meta) as any,
    pageMargins: [40, 60, 40, 50],
  };
}

// --------------- DOCX ---------------

export function strategicPlanDocx(
  content: StrategicPlanContent,
  meta: DocxMeta,
): (Paragraph | Table)[] {
  const isVi = meta.locale === 'VI';
  const p: (Paragraph | Table)[] = [];

  p.push(docxHeading(isVi ? 'Tóm Tắt Điều Hành' : 'Executive Summary', 1));
  p.push(docxParagraph(content.executiveSummary));

  p.push(docxHeading(isVi ? 'Sức Khỏe Dự Án' : 'Project Health', 1));
  p.push(docxParagraph(
    `${isVi ? 'Điểm' : 'Score'}: ${content.projectHealth.score}/100 — ${content.projectHealth.status.replace(/_/g, ' ')}`,
    { bold: true, color: healthColor(content.projectHealth.status).replace('#', '') },
  ));
  p.push(...docxBulletList(content.projectHealth.reasons));

  p.push(docxHeading(isVi ? 'Hành Động Ưu Tiên' : 'Priority Actions', 1));
  p.push(docxTable(
    [isVi ? 'Hành động' : 'Action', isVi ? 'Chủ sở hữu' : 'Owner', isVi ? 'Tác động' : 'Impact', isVi ? 'Thời hạn' : 'Timeline'],
    content.priorityActions.map((a) => [a.title, a.owner, a.impact, a.timeline]),
  ));

  p.push(docxHeading(isVi ? 'Kế Hoạch Giao Hàng' : 'Delivery Plan', 1));
  p.push(docxHeading(isVi ? '7 Ngày Tới' : 'Next 7 Days', 2));
  p.push(...docxBulletList(content.deliveryPlan.next7Days));
  p.push(docxHeading(isVi ? '30 Ngày Tới' : 'Next 30 Days', 2));
  p.push(...docxBulletList(content.deliveryPlan.next30Days));
  if (content.deliveryPlan.dependencies.length > 0) {
    p.push(docxHeading(isVi ? 'Phụ Thuộc' : 'Dependencies', 2));
    p.push(...docxBulletList(content.deliveryPlan.dependencies));
  }

  if (content.riskMatrix && content.riskMatrix.length > 0) {
    p.push(docxHeading(isVi ? 'Ma Trận Rủi Ro' : 'Risk Matrix', 1));
    p.push(docxTable(
      [isVi ? 'Rủi ro' : 'Risk', isVi ? 'Xác suất' : 'Probability', isVi ? 'Nghiêm trọng' : 'Severity', isVi ? 'Giải pháp' : 'Mitigation'],
      content.riskMatrix.map((r) => [r.risk, r.probability, r.severity, r.mitigation]),
    ));
  }

  p.push(docxHeading(isVi ? 'Thông Tin Thương Mại' : 'Commercial Insights', 1));
  p.push(docxParagraph(`${isVi ? 'Sức khỏe ngân sách' : 'Budget Health'}: ${content.commercialInsights.budgetHealth}`, { bold: true }));
  if (content.commercialInsights.invoiceAlerts.length > 0) {
    p.push(docxHeading(isVi ? 'Cảnh báo hóa đơn' : 'Invoice Alerts', 2));
    p.push(...docxBulletList(content.commercialInsights.invoiceAlerts));
  }
  if (content.commercialInsights.costOptimization.length > 0) {
    p.push(docxHeading(isVi ? 'Tối ưu chi phí' : 'Cost Optimization', 2));
    p.push(...docxBulletList(content.commercialInsights.costOptimization));
  }

  if (content.aiAutomationOpportunities.length > 0) {
    p.push(docxHeading(isVi ? 'Cơ Hội Tự Động Hóa AI' : 'AI Automation Opportunities', 1));
    p.push(...docxBulletList(content.aiAutomationOpportunities));
  }

  p.push(docxHeading(isVi ? 'Cập Nhật Stakeholders' : 'Stakeholder Updates', 1));
  p.push(docxHeading(isVi ? 'Đội ngũ nội bộ' : 'Internal Team', 2));
  p.push(docxParagraph(content.stakeholderUpdates.forInternalTeam));
  p.push(docxHeading(isVi ? 'Khách hàng' : 'Client', 2));
  p.push(docxParagraph(content.stakeholderUpdates.forClient));

  return p;
}

// --------------- XLSX ---------------

export function strategicPlanXlsx(
  content: StrategicPlanContent,
  meta: { locale: string },
): XlsxSheet[] {
  const isVi = meta.locale === 'VI';
  const sheets: XlsxSheet[] = [];

  // Priority Actions
  sheets.push({
    name: isVi ? 'Hành Động Ưu Tiên' : 'Priority Actions',
    headers: [
      isVi ? 'Hành động' : 'Action',
      isVi ? 'Chủ sở hữu' : 'Owner',
      isVi ? 'Tác động' : 'Impact',
      isVi ? 'Thời hạn' : 'Timeline',
      isVi ? 'Chi tiết' : 'Details',
    ],
    rows: content.priorityActions.map((a) => [a.title, a.owner, a.impact, a.timeline, a.details]),
  });

  // Risk Matrix
  if (content.riskMatrix && content.riskMatrix.length > 0) {
    sheets.push({
      name: isVi ? 'Ma Trận Rủi Ro' : 'Risk Matrix',
      headers: [
        isVi ? 'Rủi ro' : 'Risk',
        isVi ? 'Xác suất' : 'Probability',
        isVi ? 'Nghiêm trọng' : 'Severity',
        isVi ? 'Giải pháp' : 'Mitigation',
      ],
      rows: content.riskMatrix.map((r) => [r.risk, r.probability, r.severity, r.mitigation]),
    });
  }

  // Delivery Plan
  const deliveryRows: (string | number)[][] = [];
  for (const item of content.deliveryPlan.next7Days) {
    deliveryRows.push([isVi ? '7 ngày tới' : 'Next 7 Days', item]);
  }
  for (const item of content.deliveryPlan.next30Days) {
    deliveryRows.push([isVi ? '30 ngày tới' : 'Next 30 Days', item]);
  }
  sheets.push({
    name: isVi ? 'Kế Hoạch' : 'Delivery Plan',
    headers: [isVi ? 'Giai đoạn' : 'Period', isVi ? 'Hạng mục' : 'Item'],
    rows: deliveryRows,
  });

  return sheets;
}
