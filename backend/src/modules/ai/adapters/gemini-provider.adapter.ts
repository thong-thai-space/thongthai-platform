import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProviderPort, AiMessageParam } from '../domain/ai.provider.port';

// Default Gemini model; override with GEMINI_MODEL.
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

// Pattern: Adapter — Google Gemini arm of the Provider Router. Maps the
// provider-neutral message shape onto Gemini's contents API (assistant → model)
// and the system text onto systemInstruction. Uses its own configured model;
// the API key is read lazily so the app boots when Gemini isn't selected.
@Injectable()
export class GeminiProviderAdapter implements AiProviderPort {
  private client?: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {}

  // protected so tests can substitute a fake client without mocking the SDK module.
  protected getClient(): GoogleGenerativeAI {
    if (!this.client) {
      this.client = new GoogleGenerativeAI(
        this.config.getOrThrow<string>('GEMINI_API_KEY'),
      );
    }
    return this.client;
  }

  async createMessage(params: {
    model: string;
    maxTokens: number;
    system: string;
    messages: AiMessageParam[];
  }) {
    const modelName =
      this.config.get<string>('GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL;
    const model = this.getClient().getGenerativeModel({
      model: modelName,
      systemInstruction: params.system,
    });

    const result = await model.generateContent({
      contents: params.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: params.maxTokens },
    });

    const usage = result.response.usageMetadata;
    return {
      text: result.response.text(),
      usage: {
        inputTokens: usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
      },
    };
  }
}
