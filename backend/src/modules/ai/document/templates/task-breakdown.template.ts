import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { Paragraph, Table } from 'docx';
import {
  coverPage,
  sectionHeading,
  styledTable,
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

export interface TaskBreakdownContent {
  milestones: {
    title: string;
    description?: string;
    tasks: {
      title: string;
      description: string;
      estimatedHours: number;
      priority: string;
      labels: string[];
    }[];
  }[];
}

function priorityColor(p: string): string {
  switch (p?.toUpperCase()) {
    case 'HIGH': return '#DC2626';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW': return '#16A34A';
    default: return '#6B7280';
  }
}

// --------------- PDF ---------------

export function taskBreakdownPdf(
  content: TaskBreakdownContent,
  meta: PdfMeta,
): TDocumentDefinitions {
  const isVi = meta.locale === 'VI';
  const body: Content[] = [];

  const totalTasks = content.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const totalHours = content.milestones.reduce(
    (sum, m) => sum + m.tasks.reduce((s, t) => s + t.estimatedHours, 0),
    0,
  );

  body.push(sectionHeading(isVi ? 'Tổng Quan' : 'Summary', 1));
  body.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: String(content.milestones.length), fontSize: 24, bold: true, color: '#2563EB', alignment: 'center' as const },
          { text: isVi ? 'Milestones' : 'Milestones', fontSize: 9, color: '#6B7280', alignment: 'center' as const },
        ],
      },
      {
        width: '*',
        stack: [
          { text: String(totalTasks), fontSize: 24, bold: true, color: '#7C3AED', alignment: 'center' as const },
          { text: isVi ? 'Công việc' : 'Tasks', fontSize: 9, color: '#6B7280', alignment: 'center' as const },
        ],
      },
      {
        width: '*',
        stack: [
          { text: `${totalHours}h`, fontSize: 24, bold: true, color: '#059669', alignment: 'center' as const },
          { text: isVi ? 'Tổng giờ' : 'Total Hours', fontSize: 9, color: '#6B7280', alignment: 'center' as const },
        ],
      },
    ],
    margin: [0, 10, 0, 20],
  });

  for (const milestone of content.milestones) {
    body.push(sectionHeading(milestone.title, 1));
    if (milestone.description) {
      body.push({ text: milestone.description, style: 'bodyText', margin: [0, 0, 0, 8] });
    }

    body.push(
      styledTable(
        [
          isVi ? 'Công việc' : 'Task',
          isVi ? 'Mô tả' : 'Description',
          isVi ? 'Giờ' : 'Hours',
          isVi ? 'Ưu tiên' : 'Priority',
          'Labels',
        ],
        milestone.tasks.map((t) => [
          t.title,
          t.description,
          `${t.estimatedHours}h`,
          { text: t.priority, color: priorityColor(t.priority), bold: true },
          t.labels.join(', '),
        ]),
        ['*', '*', 45, 60, 80],
      ),
    );
  }

  return {
    content: [...coverPage(meta), ...body],
    styles: defaultStyles,
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.4 },
    footer: defaultFooter(meta) as any,
    pageMargins: [40, 60, 40, 50],
  };
}

// --------------- DOCX ---------------

export function taskBreakdownDocx(
  content: TaskBreakdownContent,
  meta: DocxMeta,
): (Paragraph | Table)[] {
  const isVi = meta.locale === 'VI';
  const paragraphs: (Paragraph | Table)[] = [];

  const totalTasks = content.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const totalHours = content.milestones.reduce(
    (sum, m) => sum + m.tasks.reduce((s, t) => s + t.estimatedHours, 0),
    0,
  );

  paragraphs.push(docxHeading(isVi ? 'Tổng Quan' : 'Summary', 1));
  paragraphs.push(docxParagraph(
    `${content.milestones.length} milestones | ${totalTasks} ${isVi ? 'công việc' : 'tasks'} | ${totalHours}h ${isVi ? 'tổng' : 'total'}`,
    { bold: true, color: '2563EB' },
  ));

  for (const milestone of content.milestones) {
    paragraphs.push(docxHeading(milestone.title, 1));
    if (milestone.description) {
      paragraphs.push(docxParagraph(milestone.description));
    }
    paragraphs.push(
      docxTable(
        [
          isVi ? 'Công việc' : 'Task',
          isVi ? 'Mô tả' : 'Description',
          isVi ? 'Giờ' : 'Hours',
          isVi ? 'Ưu tiên' : 'Priority',
          'Labels',
        ],
        milestone.tasks.map((t) => [
          t.title,
          t.description,
          `${t.estimatedHours}h`,
          t.priority,
          t.labels.join(', '),
        ]),
      ),
    );
  }

  return paragraphs;
}

// --------------- XLSX ---------------

export function taskBreakdownXlsx(
  content: TaskBreakdownContent,
  meta: { locale: string },
): XlsxSheet[] {
  const isVi = meta.locale === 'VI';
  const allTasks: (string | number)[][] = [];

  for (const milestone of content.milestones) {
    for (const task of milestone.tasks) {
      allTasks.push([
        milestone.title,
        task.title,
        task.description,
        task.estimatedHours,
        task.priority,
        task.labels.join(', '),
      ]);
    }
  }

  return [
    {
      name: isVi ? 'Công Việc' : 'Tasks',
      headers: [
        'Milestone',
        isVi ? 'Công việc' : 'Task',
        isVi ? 'Mô tả' : 'Description',
        isVi ? 'Giờ' : 'Hours',
        isVi ? 'Ưu tiên' : 'Priority',
        'Labels',
      ],
      rows: allTasks,
      columnFormats: { 3: '#,##0' },
    },
  ];
}
