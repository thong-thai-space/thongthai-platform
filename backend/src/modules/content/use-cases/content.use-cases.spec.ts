import { NotFoundException } from '@nestjs/common';
import type { ContentRepositoryPort } from '../domain/content.repository.port';
import type { ContentSectionValidatorPort } from '../domain/content.validator.port';
import { ContentUseCases } from './content.use-cases';

function buildSut() {
  const repo: jest.Mocked<ContentRepositoryPort> = {
    findAllActive: jest.fn(),
    findBySection: jest.fn(),
    upsert: jest.fn(),
    deleteBySection: jest.fn(),
  };
  const validator: jest.Mocked<ContentSectionValidatorPort> = {
    validate: jest.fn(),
  };
  return { useCase: new ContentUseCases(repo, validator), repo, validator };
}

describe('ContentUseCases', () => {
  it('delegates findAll to repository', async () => {
    const { useCase, repo } = buildSut();
    repo.findAllActive.mockResolvedValue([] as never);

    await useCase.findAll();
    expect(repo.findAllActive).toHaveBeenCalled();
  });

  it('validates before upsert', async () => {
    const { useCase, repo, validator } = buildSut();
    repo.upsert.mockResolvedValue({} as never);

    await useCase.upsert('hero', { title: 'x' });

    expect(validator.validate).toHaveBeenCalledWith('hero', { title: 'x' });
    expect(repo.upsert).toHaveBeenCalledWith('hero', { title: 'x' }, true);
  });

  it('does not upsert when validator throws', async () => {
    const { useCase, repo, validator } = buildSut();
    validator.validate.mockImplementation(() => {
      throw new Error('bad section');
    });

    await expect(useCase.upsert('bad', {})).rejects.toThrow('bad section');
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('throws NotFound when removing missing section', async () => {
    const { useCase, repo } = buildSut();
    repo.findBySection.mockResolvedValue(null);

    await expect(useCase.remove('hero')).rejects.toThrow(NotFoundException);
    expect(repo.deleteBySection).not.toHaveBeenCalled();
  });

  it('removes existing section', async () => {
    const { useCase, repo } = buildSut();
    repo.findBySection.mockResolvedValue({ id: '1' } as never);
    repo.deleteBySection.mockResolvedValue({ id: '1' } as never);

    await useCase.remove('hero');
    expect(repo.deleteBySection).toHaveBeenCalledWith('hero');
  });

  it('seeds all default sections', async () => {
    const { useCase, repo, validator } = buildSut();
    repo.upsert.mockResolvedValue({} as never);

    const result = await useCase.seed();
    expect(repo.upsert).toHaveBeenCalled();
    expect(validator.validate).toHaveBeenCalled();
    expect(result.message).toMatch(/Seeded/);
  });
});
