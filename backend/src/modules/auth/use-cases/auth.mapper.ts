import type { AuthUser, PublicAuthUser } from '../domain/auth.types';

// Pattern: Mapper — pure function that strips sensitive fields before sending to clients
export function stripPassword<T extends Pick<AuthUser, 'password'>>(
  user: T,
): Omit<T, 'password'> {
  const { password: _password, ...rest } = user;
  return rest;
}
