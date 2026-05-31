import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import * as mammoth from 'mammoth';
import { DOCX_MIME } from '../rag.constants';
import type {
  DocumentParserPort,
  ParsableFile,
} from '../domain/document-parser.port';

/**
 * Pattern: Strategy — routes an uploaded file to a format-specific text
 * extractor (PDF via pdf-parse, DOCX via mammoth, TXT/MD as UTF-8) and returns
 * clean text for the ingestion pipeline. Unsupported types are rejected.
 *
 * A scanned / image-only PDF yields empty text; the ingest use-case then marks
 * the document FAILED rather than indexing nothing silently.
 */
@Injectable()
export class MultiFormatDocumentParser implements DocumentParserPort {
  async extractText(file: ParsableFile): Promise<string> {
    const ext = extname(file.filename).toLowerCase();
    const mime = file.mimeType?.toLowerCase() ?? '';

    if (mime === 'application/pdf' || ext === '.pdf') {
      return this.extractPdf(file.buffer);
    }
    if (mime === DOCX_MIME || ext === '.docx') {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer });
      return value.trim();
    }
    if (mime.startsWith('text/') || ext === '.txt' || ext === '.md') {
      return file.buffer.toString('utf8').trim();
    }

    throw new BadRequestException(
      `Unsupported document type: ${file.mimeType || ext || 'unknown'}`,
    );
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    // Lazy import: defers loading pdfjs (heavy) until a PDF is actually parsed,
    // and keeps it out of unit tests that exercise the text/docx paths.
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const { text } = await parser.getText();
      return text.trim();
    } finally {
      await parser.destroy();
    }
  }
}
