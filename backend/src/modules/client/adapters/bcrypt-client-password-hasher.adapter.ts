import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CLIENT_HASH_ROUNDS } from '../client.constants';
import type { ClientPasswordHasherPort } from '../domain/client.password-hasher.port';

@Injectable()
export class BcryptClientPasswordHasher implements ClientPasswordHasherPort {
  hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, CLIENT_HASH_ROUNDS);
  }
}
