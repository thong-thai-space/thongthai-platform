import api from './api';

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

export type ExportFormat = 'pdf' | 'docx' | 'xlsx';

export type ExportFeature =
  | 'proposal'
  | 'progress-report'
  | 'estimate'
  | 'task-breakdown'
  | 'strategic-plan';

/**
 * Export document via backend document generation service.
 * Backend generates professional PDF/DOCX/XLSX with proper formatting.
 */
export async function exportDocument(
  feature: ExportFeature,
  format: ExportFormat,
  content: unknown,
  options?: { projectName?: string; locale?: string },
) {
  const response = await api.post(
    `/ai/export/${feature}`,
    {
      format,
      content,
      projectName: options?.projectName,
      locale: options?.locale,
    },
    { responseType: 'blob' },
  );

  // Extract filename from Content-Disposition header if available
  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = `${feature}.${format}`;
  if (disposition) {
    const match = disposition.match(/filename[*]?=(?:UTF-8'')?["']?([^"';\n]+)/i);
    if (match) filename = decodeURIComponent(match[1]);
  }

  triggerDownload(response.data as Blob, filename);
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

// Legacy client-side exports for non-AI pages (invoices, governance)

function safeFilename(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
}

function escapeHtml(input: string) {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function exportTextAsPdf(title: string, content: string) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content || '-', pageWidth - 28);
    doc.text(lines, 14, 28);
    doc.save(`${safeFilename(title)}.pdf`);
  });
}

export function exportJsonAsExcel(title: string, data: unknown) {
  const content = JSON.stringify(data, null, 2);
  const rows = (content || '-')
    .split(/\r?\n/)
    .map((line: string, index: number) => `${index + 1},"${line.replace(/"/g, '""')}"`);
  const csv = ['Index,Content', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${safeFilename(title)}.csv`);
}
