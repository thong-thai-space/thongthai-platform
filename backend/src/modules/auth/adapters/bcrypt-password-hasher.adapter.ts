import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AUTH_HASH_ROUNDS } from '../auth.constants';
import { AuthPasswordHasherPort } from '../domain/auth.password-hasher.port';

// Pattern: Adapter — concrete implementation of password hashing
@Injectable()
export class BcryptPasswordHasherAdapter implements AuthPasswordHasherPort {
  hash(
    plaintext: string,
    rounds: number = AUTH_HASH_ROUNDS.PASSWORD,
  ): Promise<string> {
    return bcrypt.hash(plaintext, rounds);
  }

  async compare(plaintext: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plaintext, hash);
    } catch {
      // Guard against corrupted or non-bcrypt hashes — treat as mismatch
      return false;
    }
  }
}
