// Pattern: Port — extracts plain, ingestible text from an uploaded document.
// Defined over a minimal file shape so the domain stays free of Express/Multer types.

export interface ParsableFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export interface DocumentParserPort {
  /**
   * Extract plain text from a supported document (PDF, DOCX, TXT, MD).
   * Throws BadRequestException for unsupported types.
   */
  extractText(file: ParsableFile): Promise<string>;
}
