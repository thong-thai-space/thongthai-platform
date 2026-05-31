import type { TextChunk } from './rag.types';

// Pattern: Port — splits raw document text into embeddable chunks.
export interface TextChunkerPort {
  chunk(text: string): TextChunk[];
}
