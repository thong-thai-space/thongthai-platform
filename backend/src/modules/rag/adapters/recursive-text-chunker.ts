import { Injectable } from '@nestjs/common';
import { CHUNK_MAX_CHARS, CHUNK_OVERLAP_CHARS } from '../rag.constants';
import type { TextChunkerPort } from '../domain/text-chunker.port';
import type { TextChunk } from '../domain/rag.types';

/**
 * Pattern: Strategy — paragraph-greedy chunker with character overlap.
 *
 * Packs whole paragraphs into windows up to `maxChars`; any paragraph longer
 * than the window is hard-split into `maxChars - overlap` pieces. Adjacent
 * windows share the trailing `overlap` chars so context survives boundaries.
 * Pure and deterministic — unit-tested without I/O.
 */
@Injectable()
export class RecursiveTextChunker implements TextChunkerPort {
  constructor(
    private readonly maxChars: number = CHUNK_MAX_CHARS,
    private readonly overlap: number = CHUNK_OVERLAP_CHARS,
  ) {}

  chunk(text: string): TextChunk[] {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const segments = this.splitToSegments(normalized);
    const windows: string[] = [];
    let current = '';

    for (const segment of segments) {
      if (current && current.length + segment.length + 1 > this.maxChars) {
        windows.push(current);
        current = this.tail(current);
      }
      current = current ? `${current}\n${segment}` : segment;
    }
    if (current.trim()) windows.push(current);

    return windows.map((content, index) => ({
      index,
      content: content.trim(),
      tokenCount: Math.ceil(content.trim().length / 4),
    }));
  }

  /** Split into paragraphs, hard-splitting any paragraph longer than the window. */
  private splitToSegments(text: string): string[] {
    const limit = Math.max(1, this.maxChars - this.overlap);
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const segments: string[] = [];
    for (const paragraph of paragraphs) {
      if (paragraph.length <= this.maxChars) {
        segments.push(paragraph);
        continue;
      }
      for (let i = 0; i < paragraph.length; i += limit) {
        segments.push(paragraph.slice(i, i + limit));
      }
    }
    return segments;
  }

  /** Carry the last `overlap` chars forward as context for the next window. */
  private tail(content: string): string {
    if (this.overlap <= 0) return '';
    return content.slice(-this.overlap);
  }
}
