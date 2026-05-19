import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AUTH_HASH_ROUNDS, AUTH_PASSWORD_HASHER } from '../auth.constants';
import type { AuthPasswordHasherPort } from '../domain/auth.password-hasher.port';

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Pattern: Policy — encapsulates password strength + hashing rules in one place
@Injectable()
export class PasswordPolicy {
  constructor(
    @Inject(AUTH_PASSWORD_HASHER)
    private readonly hasher: AuthPasswordHasherPort,
  ) {}

  assertStrong(password: string): void {
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
      );
    }
  }

  hash(password: string): Promise<string> {
    return this.hasher.hash(password, AUTH_HASH_ROUNDS.PASSWORD);
  }

  compare(plaintext: string, hash: string): Promise<boolean> {
    return this.hasher.compare(plaintext, hash);
  }
}
