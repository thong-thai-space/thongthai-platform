import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiProviderPort, AiMessageParam } from '../domain/ai.provider.port';

// Default OpenAI chat model; override with OPENAI_MODEL.
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

// Pattern: Adapter — OpenAI arm of the Provider Router. The caller-supplied
// `model` is Claude-centric (a shared AI_MODEL constant), so this adapter uses
// its own configured OpenAI model instead. The API key is read lazily so the
// app boots fine when OpenAI isn't the selected provider.
@Injectable()
export class OpenAiProviderAdapter implements AiProviderPort {
  private client?: OpenAI;

  constructor(private readonly config: ConfigService) {}

  // protected so tests can substitute a fake client without mocking the SDK module.
  protected getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  async createMessage(params: {
    model: string;
    maxTokens: number;
    system: string;
    messages: AiMessageParam[];
  }) {
    // `|| ` (not `??`) so a blank OPENAI_MODEL falls back to the default.
    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_OPENAI_MODEL;
    const response = await this.getClient().chat.completions.create({
      model,
      max_tokens: params.maxTokens,
      messages: [
        { role: 'system', content: params.system },
        ...params.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    return {
      text,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }
}
