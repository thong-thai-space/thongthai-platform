import { NotFoundException, BadRequestException } from '@nestjs/common';
import type { ContactRepositoryPort } from '../domain/contact.repository.port';
import { ContactStatusPolicy } from '../policies/contact-status.policy';
import { UpdateLeadStatusUseCase } from './update-lead-status.use-case';

// Pattern: Unit-test against ports — fake repository, real policy (state-machine logic).

function buildSubject(existing: { status: string } | null) {
  const repo: ContactRepositoryPort = {
    createContactRequest: jest.fn(),
    findActiveAdminIds: jest.fn(),
    listContactRequests: jest.fn(),
    findContactRequestById: jest.fn(async () =>
      existing
        ? ({
            id: 'cr_1',
            status: existing.status,
            createdAt: new Date(),
            updatedAt: new Date(),
            name: 'Alice',
            email: 'a@example.com',
            phone: null,
            company: null,
            service: null,
            budget: null,
            message: 'Hello',
          } as never)
        : null,
    ),
    updateContactRequestStatus: jest.fn(async (id, status) => ({
      id,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'Alice',
      email: 'a@example.com',
      phone: null,
      company: null,
      service: null,
      budget: null,
      message: 'Hello',
    })) as unknown as ContactRepositoryPort['updateContactRequestStatus'],
  };
  return { repo, useCase: new UpdateLeadStatusUseCase(repo, new ContactStatusPolicy()) };
}

describe('UpdateLeadStatusUseCase', () => {
  it('throws NotFound when the lead does not exist', async () => {
    const { useCase } = buildSubject(null);
    await expect(useCase.execute('missing', 'REVIEWED')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks invalid transitions via the policy', async () => {
    const { useCase, repo } = buildSubject({ status: 'NEW' });
    await expect(useCase.execute('cr_1', 'CONVERTED')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.updateContactRequestStatus).not.toHaveBeenCalled();
  });

  it('persists allowed transitions', async () => {
    const { useCase, repo } = buildSubject({ status: 'NEW' });
    const result = await useCase.execute('cr_1', 'REVIEWED');
    expect(repo.updateContactRequestStatus).toHaveBeenCalledWith('cr_1', 'REVIEWED');
    expect(result.status).toBe('REVIEWED');
  });
});
