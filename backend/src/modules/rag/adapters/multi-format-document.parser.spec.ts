import { BadRequestException } from '@nestjs/common';
import { MultiFormatDocumentParser } from './multi-format-document.parser';
import type { ParsableFile } from '../domain/document-parser.port';

// Pattern: Unit test — covers the text/markdown + rejection paths. PDF/DOCX
// extraction delegates to pdf-parse/mammoth and is verified at runtime.

function file(overrides: Partial<ParsableFile>): ParsableFile {
  return {
    buffer: Buffer.from(''),
    mimeType: 'text/plain',
    filename: 'note.txt',
    ...overrides,
  };
}

describe('MultiFormatDocumentParser', () => {
  const parser = new MultiFormatDocumentParser();

  it('extracts UTF-8 text from a text/plain file', async () => {
    await expect(
      parser.extractText(file({ buffer: Buffer.from('Hello world') })),
    ).resolves.toBe('Hello world');
  });

  it('extracts markdown by extension even when the mime is octet-stream', async () => {
    await expect(
      parser.extractText(
        file({
          buffer: Buffer.from('# Title\n\nBody'),
          mimeType: 'application/octet-stream',
          filename: 'readme.md',
        }),
      ),
    ).resolves.toBe('# Title\n\nBody');
  });

  it('trims surrounding whitespace', async () => {
    await expect(
      parser.extractText(file({ buffer: Buffer.from('  spaced  ') })),
    ).resolves.toBe('spaced');
  });

  it('rejects unsupported types', async () => {
    await expect(
      parser.extractText(file({ mimeType: 'image/png', filename: 'pic.png' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
