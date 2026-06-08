import type { ConfigService } from '@nestjs/config';
import { createAiProvider } from './ai-provider.factory';
import { AiProviderAdapter } from './ai-provider.adapter';
import { OpenAiProviderAdapter } from './openai-provider.adapter';
import { GeminiProviderAdapter } from './gemini-provider.adapter';

function fakeConfig(provider?: string): ConfigService {
  return {
    get: (key: string) => (key === 'AI_PROVIDER' ? provider : undefined),
    getOrThrow: (key: string) => `dummy-${key}`,
  } as unknown as ConfigService;
}

describe('createAiProvider', () => {
  it('defaults to the Anthropic (Claude) adapter', () => {
    expect(createAiProvider(fakeConfig())).toBeInstanceOf(AiProviderAdapter);
    expect(createAiProvider(fakeConfig('claude'))).toBeInstanceOf(
      AiProviderAdapter,
    );
    // Case-insensitive.
    expect(createAiProvider(fakeConfig('CLAUDE'))).toBeInstanceOf(
      AiProviderAdapter,
    );
  });

  it('selects the OpenAI adapter', () => {
    expect(createAiProvider(fakeConfig('openai'))).toBeInstanceOf(
      OpenAiProviderAdapter,
    );
  });

  it('selects the Gemini adapter', () => {
    expect(createAiProvider(fakeConfig('gemini'))).toBeInstanceOf(
      GeminiProviderAdapter,
    );
  });

  it('throws on an unknown provider', () => {
    expect(() => createAiProvider(fakeConfig('grok'))).toThrow(
      /Unknown AI_PROVIDER/,
    );
  });
});
