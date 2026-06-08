import type { ConfigService } from '@nestjs/config';
import type { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiProviderAdapter } from './gemini-provider.adapter';

class TestableGemini extends GeminiProviderAdapter {
  constructor(private readonly fakeClient: GoogleGenerativeAI) {
    super({ get: () => undefined } as unknown as ConfigService);
  }
  protected getClient(): GoogleGenerativeAI {
    return this.fakeClient;
  }
}

describe('GeminiProviderAdapter', () => {
  it('maps roles (assistant→model), sets systemInstruction, and returns text + usage', async () => {
    const generateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => 'Trả lời',
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
      },
    });
    const getGenerativeModel = jest.fn().mockReturnValue({ generateContent });
    const adapter = new TestableGemini({
      getGenerativeModel,
    } as unknown as GoogleGenerativeAI);

    const res = await adapter.createMessage({
      model: 'claude-sonnet-4-20250514',
      maxTokens: 50,
      system: 'You are helpful',
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'More' },
      ],
    });

    expect(res).toEqual({
      text: 'Trả lời',
      usage: { inputTokens: 5, outputTokens: 3 },
    });

    expect(getGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are helpful',
    });

    const calls = generateContent.mock.calls as Array<
      [
        {
          contents: { role: string; parts: { text: string }[] }[];
          generationConfig: { maxOutputTokens: number };
        },
      ]
    >;
    const arg = calls[0][0];
    expect(arg.contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(arg.contents[0].parts[0]).toEqual({ text: 'Hi' });
    expect(arg.generationConfig.maxOutputTokens).toBe(50);
  });

  it('throws a clear error when GEMINI_API_KEY is blank', async () => {
    const adapter = new GeminiProviderAdapter({
      get: () => '',
    } as unknown as ConfigService);
    await expect(
      adapter.createMessage({
        model: 'x',
        maxTokens: 10,
        system: 's',
        messages: [{ role: 'user', content: 'q' }],
      }),
    ).rejects.toThrow(/GEMINI_API_KEY is required/);
  });
});
