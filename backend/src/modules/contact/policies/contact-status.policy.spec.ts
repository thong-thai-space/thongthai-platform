import { BadRequestException } from '@nestjs/common';
import { ContactStatusPolicy } from './contact-status.policy';

describe('ContactStatusPolicy', () => {
  const policy = new ContactStatusPolicy();

  it.each([
    ['NEW', 'REVIEWED'],
    ['NEW', 'CLOSED'],
    ['REVIEWED', 'CONTACTED'],
    ['REVIEWED', 'CLOSED'],
    ['CONTACTED', 'CONVERTED'],
    ['CONTACTED', 'CLOSED'],
    ['CONVERTED', 'CLOSED'],
  ] as const)('allows %s -> %s', (from, to) => {
    expect(() => policy.assertTransition(from, to)).not.toThrow();
  });

  it.each([
    ['NEW', 'CONTACTED'],
    ['NEW', 'CONVERTED'],
    ['REVIEWED', 'CONVERTED'],
    ['CONTACTED', 'REVIEWED'],
    ['CONVERTED', 'CONTACTED'],
    ['CLOSED', 'NEW'],
    ['CLOSED', 'REVIEWED'],
  ] as const)('rejects %s -> %s', (from, to) => {
    expect(() => policy.assertTransition(from, to)).toThrow(BadRequestException);
  });

  it('rejects same-status transitions', () => {
    expect(() => policy.assertTransition('NEW', 'NEW')).toThrow(
      BadRequestException,
    );
  });
});
