type EnvRecord = Record<string, string | undefined>;

function ensure(env: EnvRecord, key: string) {
  const value = env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function ensureNumber(env: EnvRecord, key: string, fallback?: string) {
  const raw = env[key] ?? fallback;
  if (!raw) {
    throw new Error(`Missing required numeric environment variable: ${key}`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return value;
}

function ensureUrl(env: EnvRecord, key: string) {
  const value = ensure(env, key);
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL`);
  }
}

export function validateEnv(env: EnvRecord) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, test, production');
  }

  ensure(env, 'DATABASE_URL');
  ensure(env, 'JWT_SECRET');
  ensure(env, 'JWT_REFRESH_SECRET');
  ensure(env, 'ANTHROPIC_API_KEY');
  ensure(env, 'REDIS_URL');
  ensureUrl(env, 'FRONTEND_URL');

  const r2Keys = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];
  const hasAnyR2Config = r2Keys.some((key) => {
    const value = env[key];
    return Boolean(value && value.trim() !== '');
  });

  if (hasAnyR2Config) {
    ensure(env, 'R2_ACCOUNT_ID');
    ensure(env, 'R2_ACCESS_KEY_ID');
    ensure(env, 'R2_SECRET_ACCESS_KEY');
    ensure(env, 'R2_BUCKET_NAME');
    ensureUrl(env, 'R2_PUBLIC_URL');
  }

  const port = ensureNumber(env, 'PORT', '4000');

  return {
    ...env,
    NODE_ENV: nodeEnv,
    PORT: String(port),
  };
}
