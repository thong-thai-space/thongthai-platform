import { BadRequestException, Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export interface ParsedFileContext {
  textContext: string;
  imagePayload?: {
    mediaType: 'image/png' | 'image/jpeg';
    data: string;
  };
}

@Injectable()
export class FileParserService {
  private readonly allowedMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]);

  assertSupported(file: Express.Multer.File) {
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not supported`,
      );
    }
  }

  async parse(file?: Express.Multer.File): Promise<ParsedFileContext> {
    if (!file) {
      return { textContext: '' };
    }

    this.assertSupported(file);

    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      return {
        textContext:
          'Attached image was provided for visual architecture context.',
        imagePayload: {
          mediaType: file.mimetype,
          data: file.buffer.toString('base64'),
        },
      };
    }

    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const extracted = await mammoth.extractRawText({ buffer: file.buffer });
      return {
        textContext: this.limitText(
          `Extracted DOCX content:\n${extracted.value || ''}`,
          12000,
        ),
      };
    }

    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const rows: string[] = [];
      let remainingRows = 200;

      workbook.SheetNames.forEach((sheetName) => {
        if (remainingRows <= 0) return;
        rows.push(`Sheet: ${sheetName}`);

        const sheet = workbook.Sheets[sheetName];
        const values = XLSX.utils.sheet_to_json<(string | number | null)[]>(
          sheet,
          {
            header: 1,
            raw: false,
          },
        );

        values.forEach((row) => {
          if (remainingRows <= 0) return;

          const normalized = (row || [])
            .map((value) =>
              value === null || value === undefined ? '' : String(value).trim(),
            )
            .filter((value) => value.length > 0)
            .join(' | ');

          if (normalized.length > 0) {
            rows.push(normalized);
            remainingRows -= 1;
          }
        });
      });

      return {
        textContext: this.limitText(
          `Extracted XLSX content (max 200 rows):\n${rows.join('\n')}`,
          12000,
        ),
      };
    }

    const slideTexts = await this.extractPptxText(file.buffer);
    return {
      textContext: this.limitText(
        `Extracted PPTX text content (layout not preserved):\n${slideTexts.join('\n')}`,
        12000,
      ),
    };
  }

  private async extractPptxText(buffer: Buffer): Promise<string[]> {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const lines: string[] = [];

    for (const slideFile of slideFiles) {
      const xml = await zip.files[slideFile].async('text');
      const matches = Array.from(xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g));
      const text = matches
        .map((match) => this.decodeXml(match[1]))
        .map((value) => value.trim())
        .filter(Boolean)
        .join(' | ');

      if (text.length > 0) {
        lines.push(`${slideFile}: ${text}`);
      }
    }

    if (lines.length === 0) {
      lines.push('No extractable text found in PPTX slides.');
    }

    return lines;
  }

  private decodeXml(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  private limitText(input: string, max: number): string {
    return input.length <= max ? input : `${input.slice(0, max)}...`;
  }
}
