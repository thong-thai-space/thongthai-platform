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

export function exportTextAsPdf(title: string, content: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  const lines = doc.splitTextToSize(content || '-', pageWidth - 28);
  doc.text(lines, 14, 28);

  doc.save(`${safeFilename(title)}.pdf`);
}

export function exportTextAsWord(title: string, content: string) {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body>
    <h1>${title}</h1>
    <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.45;">${escapeHtml(
      content || '-',
    )}</pre>
  </body>
</html>`;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  triggerDownload(blob, `${safeFilename(title)}.doc`);
}

export function exportTextAsExcel(title: string, content: string) {
  const rows = (content || '-')
    .split(/\r?\n/)
    .map((line, index) => `${index + 1},"${line.replace(/"/g, '""')}"`);
  const csv = ['Index,Content', ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${safeFilename(title)}.csv`);
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
