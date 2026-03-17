import { jsPDF } from 'jspdf';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function safeFilename(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'export';
}

type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

function parseContentBlocks(content: string): Block[] {
  const lines = (content || '-')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());

  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() });
      i += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      i += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
      i += 1;
      continue;
    }

    if (/^(\-|\*|\d+\.)\s+/.test(line)) {
      blocks.push({
        type: 'bullet',
        text: line.replace(/^(\-|\*|\d+\.)\s+/, '').trim(),
      });
      i += 1;
      continue;
    }

    // Very light markdown-table support.
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*[-:]+/.test(lines[i + 1])) {
      const headers = line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i]
          .split('|')
          .map((cell) => cell.trim())
          .filter(Boolean);
        if (row.length > 0) rows.push(row);
        i += 1;
      }
      if (headers.length > 0) {
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    let paragraph = line;
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(#|\-|\*|\d+\.|\|)/.test(lines[i].trim())) {
      paragraph += ` ${lines[i].trim()}`;
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph });
  }

  return blocks;
}

function renderStyledHtml(title: string, content: string) {
  const blocks = parseContentBlocks(content);

  const body = blocks
    .map((block) => {
      if (block.type === 'h1') return `<h1>${escapeHtml(block.text)}</h1>`;
      if (block.type === 'h2') return `<h2>${escapeHtml(block.text)}</h2>`;
      if (block.type === 'h3') return `<h3>${escapeHtml(block.text)}</h3>`;
      if (block.type === 'bullet') return `<li>${escapeHtml(block.text)}</li>`;
      if (block.type === 'table') {
        const head = `<tr>${block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
        const rows = block.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
          .join('');
        return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
      }
      return `<p>${escapeHtml(block.text)}</p>`;
    })
    .join('\n')
    .replace(/(?:<li>.*?<\/li>\n?)+/gs, (listItems) => `<ul>${listItems}</ul>`);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        font-family: "Segoe UI", Arial, sans-serif;
        color: #1f2937;
        padding: 28px;
        line-height: 1.55;
      }
      h1 {
        font-size: 24px;
        margin: 0 0 16px;
        color: #0f172a;
      }
      h2 {
        font-size: 18px;
        margin: 18px 0 8px;
        color: #1e3a8a;
      }
      h3 {
        font-size: 15px;
        margin: 14px 0 6px;
        color: #1f2937;
      }
      p {
        margin: 6px 0;
      }
      ul {
        margin: 8px 0 8px 18px;
        padding: 0;
      }
      li {
        margin: 4px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 7px 8px;
        font-size: 12px;
        text-align: left;
      }
      th {
        background: #f3f4f6;
        color: #111827;
      }
      .meta {
        margin-bottom: 16px;
        font-size: 11px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">Generated at ${new Date().toLocaleString('en-US')}</div>
    ${body || '<p>-</p>'}
  </body>
</html>`;
}

function buildExcelHtml(title: string, content: string) {
  const blocks = parseContentBlocks(content);
  const rows: string[] = [];

  rows.push(`<tr><th colspan="3">${escapeHtml(title)}</th></tr>`);
  rows.push(`<tr><td colspan="3">Generated at ${escapeHtml(new Date().toLocaleString('en-US'))}</td></tr>`);
  rows.push('<tr><td colspan="3"></td></tr>');

  for (const block of blocks) {
    if (block.type === 'table') {
      rows.push(`<tr>${block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`);
      for (const row of block.rows) {
        rows.push(`<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`);
      }
      rows.push('<tr><td colspan="3"></td></tr>');
      continue;
    }

    const kind = block.type.toUpperCase();
    const text = block.type === 'bullet' ? `• ${block.text}` : block.text;
    rows.push(`<tr><td>${escapeHtml(kind)}</td><td colspan="2">${escapeHtml(text)}</td></tr>`);
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      table {
        border-collapse: collapse;
        width: 100%;
        font-family: Calibri, Arial, sans-serif;
        font-size: 12px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 6px 8px;
        vertical-align: top;
      }
      th {
        background: #eff6ff;
        color: #1e3a8a;
        font-weight: 700;
      }
      tr:nth-child(even) td {
        background: #f8fafc;
      }
    </style>
  </head>
  <body>
    <table>${rows.join('')}</table>
  </body>
</html>`;
}

export function exportTextAsPdf(title: string, content: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  const addPageIfNeeded = (requiredHeight = 8) => {
    if (y + requiredHeight > pageHeight - 12) {
      doc.addPage();
      y = 18;
    }
  };

  const blocks = parseContentBlocks(content);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated at ${new Date().toLocaleString('en-US')}`, margin, y);
  y += 8;
  doc.setTextColor(31, 41, 55);

  for (const block of blocks) {
    if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
      addPageIfNeeded(10);
      const size = block.type === 'h1' ? 14 : block.type === 'h2' ? 12 : 11;
      doc.setFontSize(size);
      doc.setFont('helvetica', 'bold');
      doc.text(block.text, margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      continue;
    }

    if (block.type === 'table') {
      const headers = block.headers.join(' | ');
      const rows = block.rows.map((r) => `- ${r.join(' | ')}`);
      const tableLines = doc.splitTextToSize([headers, ...rows], maxWidth);
      for (const line of tableLines) {
        addPageIfNeeded(6);
        doc.text(line, margin, y);
        y += 5;
      }
      y += 2;
      continue;
    }

    const text = block.type === 'bullet' ? `• ${block.text}` : block.text;
    const lines = doc.splitTextToSize(text || '-', maxWidth);
    for (const line of lines) {
      addPageIfNeeded(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 1;
  }

  doc.save(`${safeFilename(title)}.pdf`);
}

export function exportTextAsWord(title: string, content: string) {
  const html = renderStyledHtml(title, content);

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  triggerDownload(blob, `${safeFilename(title)}.doc`);
}

export function exportTextAsExcel(title: string, content: string) {
  const html = buildExcelHtml(title, content);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, `${safeFilename(title)}.xls`);
}

export function exportJsonAsExcel(title: string, data: unknown) {
  const content = JSON.stringify(data, null, 2);
  exportTextAsExcel(title, content);
}

export function exportJsonAsWord(title: string, data: unknown) {
  const content = JSON.stringify(data, null, 2);
  exportTextAsWord(title, content);
}

export function exportJsonAsPdf(title: string, data: unknown) {
  const content = JSON.stringify(data, null, 2);
  exportTextAsPdf(title, content);
}

export async function importTextFile(accept = '.txt,.md,.json,.csv'): Promise<string> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;

  return new Promise((resolve, reject) => {
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        resolve(text);
      } catch {
        reject(new Error('Cannot read file'));
      }
    };
    input.click();
  });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
