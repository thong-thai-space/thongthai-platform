export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');
export const CLIENT_PASSWORD_HASHER = Symbol('CLIENT_PASSWORD_HASHER');

export const CLIENT_HASH_ROUNDS = 12;

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const CLIENT_PASSWORD_RULES = {
  regex: STRONG_PASSWORD_REGEX,
  message:
    'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
} as const;
