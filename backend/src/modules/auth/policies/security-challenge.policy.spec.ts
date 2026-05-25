import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { AuthSecurityChallengePort } from '../domain/auth.security-challenge.port';
import { SecurityChallengePolicy } from './security-challenge.policy';

function buildSut(enabled: boolean, verifyResult = true) {
  const challenge: jest.Mocked<AuthSecurityChallengePort> = {
    isEnabled: jest.fn().mockReturnValue(enabled),
    verify: jest.fn().mockResolvedValue(verifyResult),
  };
  return { policy: new SecurityChallengePolicy(challenge), challenge };
}

describe('SecurityChallengePolicy', () => {
  it('is no-op when disabled', async () => {
    const { policy, challenge } = buildSut(false);
    await expect(policy.enforce(undefined)).resolves.toBeUndefined();
    expect(challenge.verify).not.toHaveBeenCalled();
  });

  it('throws BadRequest when enabled but token missing', async () => {
    const { policy } = buildSut(true);
    await expect(policy.enforce(undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws Unauthorized when verification fails', async () => {
    const { policy } = buildSut(true, false);
    await expect(policy.enforce('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('passes when verification succeeds', async () => {
    const { policy } = buildSut(true, true);
    await expect(policy.enforce('good-token')).resolves.toBeUndefined();
  });
});
