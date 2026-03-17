import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { Paragraph } from 'docx';
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

export interface ProposalContent {
  raw: string;
}

// --------------- helpers ---------------

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

function bodyToContent(body: string): Content[] {
  const contents: Content[] = [];
  const lines = body.split('\n');
  const bulletItems: string[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      bulletItems.push(bulletMatch[1]);
      continue;
    }
    if (bulletItems.length) {
      contents.push(bulletList([...bulletItems]));
      bulletItems.length = 0;
    }
    const numberedMatch = line.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      contents.push({ text: numberedMatch[1], style: 'bodyText', margin: [10, 2, 0, 2] });
      continue;
    }
    if (line.trim()) {
      contents.push({ text: line.trim(), style: 'bodyText', margin: [0, 2, 0, 2] });
    }
  }
  if (bulletItems.length) {
    contents.push(bulletList(bulletItems));
  }
  return contents;
}

// --------------- PDF ---------------

export function proposalPdf(
  content: ProposalContent,
  meta: PdfMeta,
): TDocumentDefinitions {
  const sections = parseMarkdownSections(content.raw);

  const body: Content[] = [];
  for (const section of sections) {
    if (section.heading) {
      body.push(sectionHeading(section.heading, 1));
    }
    body.push(...bodyToContent(section.body));
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

export function proposalDocx(
  content: ProposalContent,
  _meta: DocxMeta,
): Paragraph[] {
  const sections = parseMarkdownSections(content.raw);
  const paragraphs: Paragraph[] = [];

  for (const section of sections) {
    if (section.heading) {
      paragraphs.push(docxHeading(section.heading, 1));
    }
    const lines = section.body.split('\n');
    const bullets: string[] = [];
    for (const line of lines) {
      const bm = line.match(/^[-*]\s+(.+)/);
      if (bm) {
        bullets.push(bm[1]);
        continue;
      }
      if (bullets.length) {
        paragraphs.push(...docxBulletList([...bullets]));
        bullets.length = 0;
      }
      if (line.trim()) {
        paragraphs.push(docxParagraph(line.trim()));
      }
    }
    if (bullets.length) {
      paragraphs.push(...docxBulletList(bullets));
    }
  }

  return paragraphs;
}

// --------------- XLSX ---------------

export function proposalXlsx(
  content: ProposalContent,
  meta: { locale: string },
): XlsxSheet[] {
  const sections = parseMarkdownSections(content.raw);
  const sectionLabel = meta.locale === 'VI' ? 'Mục' : 'Section';
  const contentLabel = meta.locale === 'VI' ? 'Nội dung' : 'Content';

  return [
    {
      name: meta.locale === 'VI' ? 'Đề Xuất' : 'Proposal',
      headers: ['#', sectionLabel, contentLabel],
      rows: sections.map((s, i) => [i + 1, s.heading || '-', s.body.slice(0, 500) || '-']),
    },
  ];
}
