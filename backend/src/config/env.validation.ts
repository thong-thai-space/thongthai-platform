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

function ensureOptionalUrl(env: EnvRecord, key: string) {
  const value = env[key];
  if (!value || value.trim() === '') return undefined;

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL`);
  }
}

function isRailwayDatabaseUrl(rawUrl: string) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host.includes('railway') || host.includes('rlwy');
  } catch {
    const normalized = rawUrl.toLowerCase();
    return normalized.includes('railway') || normalized.includes('rlwy');
  }
}

export function validateEnv(env: EnvRecord) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, test, production');
  }

  const storageProvider = env.STORAGE_PROVIDER?.trim() || 'local';
  if (!['local', 'r2'].includes(storageProvider)) {
    throw new Error('STORAGE_PROVIDER must be one of: local, r2');
  }

  const databaseUrl = ensure(env, 'DATABASE_URL');
  if (nodeEnv === 'development' && isRailwayDatabaseUrl(databaseUrl)) {
    throw new Error(
      'Unsafe DATABASE_URL: development environment cannot point to Railway. Use a local or dedicated dev database.',
    );
  }
  ensure(env, 'JWT_SECRET');
  ensure(env, 'JWT_REFRESH_SECRET');

  // Provider Router: require only the selected provider's API key, so switching
  // providers stays config-only (no need to also hold an Anthropic key).
  const aiProvider = (env.AI_PROVIDER?.trim() || 'claude').toLowerCase();
  const providerKey: Record<string, string> = {
    claude: 'ANTHROPIC_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
  };
  const requiredKey = providerKey[aiProvider];
  if (!requiredKey) {
    throw new Error('AI_PROVIDER must be one of: claude, openai, gemini');
  }
  ensure(env, requiredKey);

  ensure(env, 'REDIS_URL');
  ensureUrl(env, 'FRONTEND_URL');
  ensureOptionalUrl(env, 'GOOGLE_CALLBACK_URL');

  // VAPID keys are optional — push notifications are disabled without them.
  // Generate with: npx web-push generate-vapid-keys

  // R2 is optional at startup. Upload endpoints validate R2 config at runtime so
  // a temporary or partial R2 setup does not break Railway healthchecks.

  const port = ensureNumber(env, 'PORT', '4000');

  return {
    ...env,
    NODE_ENV: nodeEnv,
    STORAGE_PROVIDER: storageProvider,
    PORT: String(port),
  };
}
