import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { Paragraph } from 'docx';
import {
  coverPage,
  sectionHeading,
  styledTable,
  bulletList,
  progressBar,
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

export interface ProgressReportContent {
  raw: string;
}

// --------------- helpers ---------------

function extractPercentage(md: string): number {
  const m = md.match(/(\d{1,3})\s*%/);
  return m ? Math.min(Number(m[1]), 100) : 0;
}

function parseMarkdownSections(md: string): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  const lines = md.split('\n');
  let currentHeading = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    const m = line.match(/^#{1,3}\s+(.+)/);
    if (m) {
      if (currentHeading || currentBody.length) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
      }
      currentHeading = m[1];
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentHeading || currentBody.length) {
    sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
  }
  return sections;
}

function bodyToContentList(body: string): Content[] {
  const contents: Content[] = [];
  const lines = body.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const bm = line.match(/^[-*]\s+(.+)/);
    if (bm) {
      bullets.push(bm[1]);
      continue;
    }
    if (bullets.length) {
      contents.push(bulletList([...bullets]));
      bullets.length = 0;
    }
    if (line.trim()) {
      contents.push({ text: line.trim(), style: 'bodyText', margin: [0, 2, 0, 2] });
    }
  }
  if (bullets.length) contents.push(bulletList(bullets));
  return contents;
}

// --------------- PDF ---------------

export function progressReportPdf(
  content: ProgressReportContent,
  meta: PdfMeta,
): TDocumentDefinitions {
  const sections = parseMarkdownSections(content.raw);
  const percent = extractPercentage(content.raw);

  const body: Content[] = [
    sectionHeading(meta.locale === 'VI' ? 'Tiến Độ Tổng Quan' : 'Overall Progress', 1),
    progressBar(percent),
  ];

  for (const section of sections) {
    if (section.heading) {
      body.push(sectionHeading(section.heading, 2));
    }
    body.push(...bodyToContentList(section.body));
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

export function progressReportDocx(
  content: ProgressReportContent,
  meta: DocxMeta,
): Paragraph[] {
  const sections = parseMarkdownSections(content.raw);
  const percent = extractPercentage(content.raw);
  const paragraphs: Paragraph[] = [];

  paragraphs.push(docxHeading(meta.locale === 'VI' ? 'Tiến Độ Tổng Quan' : 'Overall Progress', 1));
  paragraphs.push(docxParagraph(`${'█'.repeat(Math.round(percent / 5))}${'░'.repeat(20 - Math.round(percent / 5))} ${percent}%`, { bold: true, color: percent >= 75 ? '16A34A' : percent >= 40 ? 'F59E0B' : 'DC2626' }));

  for (const section of sections) {
    if (section.heading) {
      paragraphs.push(docxHeading(section.heading, 2));
    }
    const lines = section.body.split('\n');
    const bullets: string[] = [];
    for (const line of lines) {
      const bm = line.match(/^[-*]\s+(.+)/);
      if (bm) { bullets.push(bm[1]); continue; }
      if (bullets.length) { paragraphs.push(...docxBulletList([...bullets])); bullets.length = 0; }
      if (line.trim()) paragraphs.push(docxParagraph(line.trim()));
    }
    if (bullets.length) paragraphs.push(...docxBulletList(bullets));
  }

  return paragraphs;
}

// --------------- XLSX ---------------

export function progressReportXlsx(
  content: ProgressReportContent,
  meta: { locale: string },
): XlsxSheet[] {
  const sections = parseMarkdownSections(content.raw);
  const sectionLabel = meta.locale === 'VI' ? 'Mục' : 'Section';
  const contentLabel = meta.locale === 'VI' ? 'Nội dung' : 'Content';

  return [
    {
      name: meta.locale === 'VI' ? 'Báo Cáo Tiến Độ' : 'Progress Report',
      headers: ['#', sectionLabel, contentLabel],
      rows: sections.map((s, i) => [i + 1, s.heading || '-', s.body.slice(0, 500) || '-']),
    },
  ];
}
