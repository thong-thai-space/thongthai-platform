import { validateEnv } from './env.validation';

const base = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db?schema=public',
  JWT_SECRET: 'x'.repeat(32),
  JWT_REFRESH_SECRET: 'y'.repeat(32),
  REDIS_URL: 'redis://localhost:6379',
  FRONTEND_URL: 'http://localhost:3000',
  PORT: '4000',
};

describe('validateEnv — Provider Router key requirement', () => {
  it('requires ANTHROPIC_API_KEY by default (claude)', () => {
    expect(() => validateEnv({ ...base })).toThrow(/ANTHROPIC_API_KEY/);
    expect(() =>
      validateEnv({ ...base, ANTHROPIC_API_KEY: 'sk-ant' }),
    ).not.toThrow();
  });

  it('requires only OPENAI_API_KEY when AI_PROVIDER=openai (no Anthropic key needed)', () => {
    expect(() => validateEnv({ ...base, AI_PROVIDER: 'openai' })).toThrow(
      /OPENAI_API_KEY/,
    );
    expect(() =>
      validateEnv({ ...base, AI_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-oa' }),
    ).not.toThrow();
  });

  it('requires only GEMINI_API_KEY when AI_PROVIDER=gemini', () => {
    expect(() =>
      validateEnv({ ...base, AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'g-key' }),
    ).not.toThrow();
  });

  it('rejects an unknown AI_PROVIDER', () => {
    expect(() => validateEnv({ ...base, AI_PROVIDER: 'grok' })).toThrow(
      /AI_PROVIDER must be one of/,
    );
  });
});
