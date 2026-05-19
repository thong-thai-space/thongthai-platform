import { BadRequestException } from '@nestjs/common';
import type { AuthPasswordHasherPort } from '../domain/auth.password-hasher.port';
import { PasswordPolicy } from './password.policy';

const hasher: jest.Mocked<AuthPasswordHasherPort> = {
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
};

describe('PasswordPolicy.assertStrong', () => {
  const policy = new PasswordPolicy(hasher);

  it.each([
    ['short', 'Ab1!'],
    ['no uppercase', 'aaaaaa1!'],
    ['no lowercase', 'AAAAAA1!'],
    ['no digit', 'Aaaaaaa!'],
    ['no special', 'Aaaaaa11'],
  ])('rejects %s passwords', (_label, password) => {
    expect(() => policy.assertStrong(password)).toThrow(BadRequestException);
  });

  it('accepts strong password', () => {
    expect(() => policy.assertStrong('StrongPass1!')).not.toThrow();
  });
});
