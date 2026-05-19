import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { USER_HASH_ROUNDS } from '../user.constants';
import type { UserPasswordHasherPort } from '../domain/user.password-hasher.port';

@Injectable()
export class BcryptUserPasswordHasher implements UserPasswordHasherPort {
  hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, USER_HASH_ROUNDS);
  }

  async compare(plaintext: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plaintext, hash);
    } catch {
      return false;
    }
  }
}
