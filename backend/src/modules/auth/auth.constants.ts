// Pattern: Dependency Inversion — symbols used to inject port implementations
export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
export const AUTH_EMAIL_NOTIFIER = Symbol('AUTH_EMAIL_NOTIFIER');
export const AUTH_SECURITY_CHALLENGE = Symbol('AUTH_SECURITY_CHALLENGE');
export const AUTH_PASSWORD_HASHER = Symbol('AUTH_PASSWORD_HASHER');
export const AUTH_TOKEN_SERVICE = Symbol('AUTH_TOKEN_SERVICE');

export const AUTH_TOKEN_TTL = {
  ACCESS: '15m',
  REFRESH: '7d',
  RESET_PASSWORD: '30m',
  EMAIL_VERIFICATION_MS: 24 * 60 * 60 * 1000,
} as const;

export const AUTH_HASH_ROUNDS = {
  PASSWORD: 12,
  REFRESH_TOKEN: 10,
} as const;
