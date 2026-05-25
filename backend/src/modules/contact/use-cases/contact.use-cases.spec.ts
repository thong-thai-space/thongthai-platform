import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ContactUseCases } from './contact.use-cases';
import { ContactPolicy } from '../policies/contact.policy';
import { ContactSecurityChallengePolicy } from '../policies/contact-security-challenge.policy';
import type { ContactRepositoryPort } from '../domain/contact.repository.port';
import type { ContactNotificationPort } from '../domain/contact.notification.port';
import type { ContactSecurityChallengePort } from '../domain/contact.security-challenge.port';
import { CreateContactRequestDto } from '../dto/create-contact-request.dto';

// Pattern: Unit-test against ports — wire fakes for repository + notification, and a stub
// SecurityChallengePort that we can flip enabled on/off + verify pass/fail.

function buildDto(overrides: Partial<CreateContactRequestDto> = {}): CreateContactRequestDto {
  return Object.assign(new CreateContactRequestDto(), {
    name: 'Alice',
    email: 'alice@example.com',
    message: 'Hello',
    ...overrides,
  });
}

function buildSubject(challenge: ContactSecurityChallengePort) {
  const created: unknown[] = [];
  const repo: ContactRepositoryPort = {
    createContactRequest: jest.fn(async (input) => ({
      id: 'cr_1',
      status: 'NEW',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...input,
    })) as unknown as ContactRepositoryPort['createContactRequest'],
    findActiveAdminIds: jest.fn(async () => ['admin_1']),
  } as unknown as ContactRepositoryPort;
  const notifier: ContactNotificationPort = {
    create: jest.fn(async (n) => {
      created.push(n);
    }),
  } as unknown as ContactNotificationPort;

  const policy = new ContactSecurityChallengePolicy(challenge);
  const useCases = new ContactUseCases(repo, notifier, new ContactPolicy(), policy);
  return { useCases, repo, notifier, created };
}

describe('ContactUseCases', () => {
  it('skips the challenge when Turnstile is not configured', async () => {
    const challenge: ContactSecurityChallengePort = {
      isEnabled: () => false,
      verify: jest.fn(),
    };
    const { useCases, repo } = buildSubject(challenge);

    await useCases.create(buildDto());

    expect(challenge.verify).not.toHaveBeenCalled();
    expect(repo.createContactRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects submissions without a token when the challenge is enabled', async () => {
    const challenge: ContactSecurityChallengePort = {
      isEnabled: () => true,
      verify: jest.fn(),
    };
    const { useCases, repo } = buildSubject(challenge);

    await expect(useCases.create(buildDto())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.createContactRequest).not.toHaveBeenCalled();
  });

  it('rejects submissions whose token fails verification', async () => {
    const challenge: ContactSecurityChallengePort = {
      isEnabled: () => true,
      verify: jest.fn(async () => false),
    };
    const { useCases, repo } = buildSubject(challenge);

    await expect(
      useCases.create(buildDto({ turnstileToken: 'bad' }), '203.0.113.5'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(challenge.verify).toHaveBeenCalledWith('bad', '203.0.113.5');
    expect(repo.createContactRequest).not.toHaveBeenCalled();
  });

  it('creates the request and notifies admins when the challenge passes', async () => {
    const challenge: ContactSecurityChallengePort = {
      isEnabled: () => true,
      verify: jest.fn(async () => true),
    };
    const { useCases, repo, notifier, created } = buildSubject(challenge);

    const result = await useCases.create(
      buildDto({ service: 'web', turnstileToken: 'good' }),
      '203.0.113.5',
    );

    expect(challenge.verify).toHaveBeenCalledWith('good', '203.0.113.5');
    expect(repo.createContactRequest).toHaveBeenCalledTimes(1);
    expect(notifier.create).toHaveBeenCalledTimes(1);
    expect(created).toHaveLength(1);
    expect(result.id).toBe('cr_1');
  });
});
