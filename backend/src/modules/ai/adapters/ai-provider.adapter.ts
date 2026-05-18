import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiProviderPort, AiMessageParam } from '../domain/ai.provider.port';

// Pattern: Adapter
@Injectable()
export class AiProviderAdapter implements AiProviderPort {
  private client: Anthropic;

  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
    });
  }

  async createMessage(params: {
    model: string;
    maxTokens: number;
    system: string;
    messages: AiMessageParam[];
  }) {
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
