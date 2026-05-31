import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMBEDDING_DIMENSIONS,
  MAX_EMBED_BATCH,
  VOYAGE_API_URL,
  VOYAGE_MODEL,
} from '../rag.constants';
import type { EmbeddingProviderPort } from '../domain/embedding.port';

interface VoyageEmbeddingResponse {
  data: { index: number; embedding: number[] }[];
}

/**
 * Pattern: Adapter — Voyage AI implementation of EmbeddingProviderPort.
 *
 * The API key is read lazily (not in the constructor) so the app boots without
 * it; a clear error is thrown only if RAG is actually exercised unconfigured.
 * `input_type` is set per Voyage's guidance (document vs query) for retrieval quality.
 */
@Injectable()
export class VoyageEmbeddingAdapter implements EmbeddingProviderPort {
  readonly dimensions = EMBEDDING_DIMENSIONS;
  private readonly apiKey?: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('VOYAGE_API_KEY');
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += MAX_EMBED_BATCH) {
      const batch = texts.slice(i, i + MAX_EMBED_BATCH);
      vectors.push(...(await this.embed(batch, 'document')));
    }
    return vectors;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embed([text], 'query');
    return vector;
  }

  private async embed(
    input: string[],
    inputType: 'document' | 'query',
  ): Promise<number[][]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'VOYAGE_API_KEY is not configured',
      );
    }

    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input,
        model: VOYAGE_MODEL,
        input_type: inputType,
      }),
    }).catch(() => null);

    if (!res) {
      throw new InternalServerErrorException(
        'Failed to reach the embedding provider',
      );
    }
    if (!res.ok) {
      // Never log the response body — it can echo the key in some error shapes.
      throw new InternalServerErrorException(
        `Embedding provider returned status ${res.status}`,
      );
    }

    const json = (await res.json()) as VoyageEmbeddingResponse;
    return json.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}
