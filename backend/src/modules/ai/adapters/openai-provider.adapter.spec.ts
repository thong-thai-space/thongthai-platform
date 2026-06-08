import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { OpenAiProviderAdapter } from './openai-provider.adapter';

// Subclass to inject a fake OpenAI client without mocking the SDK module.
class TestableOpenAi extends OpenAiProviderAdapter {
  constructor(
    private readonly create: jest.Mock,
    model?: string,
  ) {
    super({
      get: (key: string) => (key === 'OPENAI_MODEL' ? model : undefined),
    } as unknown as ConfigService);
  }
  protected getClient(): OpenAI {
    return {
      chat: { completions: { create: this.create } },
    } as unknown as OpenAI;
  }
}

describe('OpenAiProviderAdapter', () => {
  it('prepends the system message and maps the response to text + usage', async () => {
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'Xin chào' } }],
      usage: { prompt_tokens: 11, completion_tokens: 7 },
    });
    const adapter = new TestableOpenAi(create);

    const res = await adapter.createMessage({
      model: 'claude-sonnet-4-20250514', // Claude-centric — must be ignored
      maxTokens: 100,
      system: 'You are helpful',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(res).toEqual({
      text: 'Xin chào',
      usage: { inputTokens: 11, outputTokens: 7 },
    });

    const calls = create.mock.calls as Array<
      [
        {
          messages: { role: string; content: string }[];
          max_tokens: number;
          model: string;
        },
      ]
    >;
    const arg = calls[0][0];
    expect(arg.messages[0]).toEqual({
      role: 'system',
      content: 'You are helpful',
    });
    expect(arg.messages[1]).toEqual({ role: 'user', content: 'Hi' });
    expect(arg.max_tokens).toBe(100);
    expect(arg.model).toBe('gpt-4o-mini'); // its own default, not the Claude id
  });

  it('honors the OPENAI_MODEL override', async () => {
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    });
    const adapter = new TestableOpenAi(create, 'gpt-4o');

    await adapter.createMessage({
      model: 'x',
      maxTokens: 10,
      system: 's',
      messages: [{ role: 'user', content: 'q' }],
    });
    const calls = create.mock.calls as Array<[{ model: string }]>;
    expect(calls[0][0].model).toBe('gpt-4o');
  });

  it('falls back to the default model when OPENAI_MODEL is blank', async () => {
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    });
    const adapter = new TestableOpenAi(create, '   ');
    await adapter.createMessage({
      model: 'x',
      maxTokens: 10,
      system: 's',
      messages: [{ role: 'user', content: 'q' }],
    });
    const calls = create.mock.calls as Array<[{ model: string }]>;
    expect(calls[0][0].model).toBe('gpt-4o-mini');
  });

  it('throws a clear error when OPENAI_API_KEY is blank', async () => {
    // Real adapter (no client override) with a blank key.
    const adapter = new OpenAiProviderAdapter({
      get: () => '',
    } as unknown as ConfigService);
    await expect(
      adapter.createMessage({
        model: 'x',
        maxTokens: 10,
        system: 's',
        messages: [{ role: 'user', content: 'q' }],
      }),
    ).rejects.toThrow(/OPENAI_API_KEY is required/);
  });
});
