import { ConfigService } from '@nestjs/config';
import { AiProviderPort } from '../domain/ai.provider.port';
import { AiProviderAdapter } from './ai-provider.adapter';
import { OpenAiProviderAdapter } from './openai-provider.adapter';
import { GeminiProviderAdapter } from './gemini-provider.adapter';

/**
 * Provider Router selection (plan §6.4): picks the AI provider adapter from the
 * `AI_PROVIDER` env var (claude | openai | gemini, default claude). Switching
 * providers is a config change, not a code change — the one AiProviderPort seam
 * stays untouched for every use case and the RAG module. Only the selected
 * adapter is constructed, and env validation requires only the selected
 * provider's API key, so unused providers' keys aren't needed.
 */
export function createAiProvider(config: ConfigService): AiProviderPort {
  const provider = (config.get<string>('AI_PROVIDER') ?? 'claude')
    .trim()
    .toLowerCase();

  switch (provider) {
    case 'openai':
      return new OpenAiProviderAdapter(config);
    case 'gemini':
      return new GeminiProviderAdapter(config);
    case 'claude':
    case 'anthropic':
    case '':
      return new AiProviderAdapter(config);
    default:
      throw new Error(
        `Unknown AI_PROVIDER "${provider}" (expected claude | openai | gemini)`,
      );
  }
}
