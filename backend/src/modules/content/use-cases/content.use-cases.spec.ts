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
  describe('delegation', () => {
    it('delegates findAll to repository', async () => {
      const { useCase, repo } = buildSut();
      repo.findAllActive.mockResolvedValue([] as never);

      await useCase.findAll();
      expect(repo.findAllActive).toHaveBeenCalled();
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

  describe('upsert + locale merge', () => {
    it('validates before upsert', async () => {
      const { useCase, repo, validator } = buildSut();
      repo.findBySection.mockResolvedValue(null);
      repo.upsert.mockResolvedValue({} as never);

      const payload = { en: { title: 'Hello' } };
      await useCase.upsert('hero', payload);

      expect(validator.validate).toHaveBeenCalledWith('hero', payload);
    });

    it('does not upsert when validator throws', async () => {
      const { useCase, repo, validator } = buildSut();
      validator.validate.mockImplementation(() => {
        throw new Error('bad section');
      });

      await expect(useCase.upsert('bad', { en: {} })).rejects.toThrow(
        'bad section',
      );
      expect(repo.upsert).not.toHaveBeenCalled();
    });

    it('writes both locales as null when none exist yet and only one is provided', async () => {
      const { useCase, repo } = buildSut();
      repo.findBySection.mockResolvedValue(null);
      repo.upsert.mockResolvedValue({} as never);

      await useCase.upsert('hero', { en: { title: 'Hello' } });

      expect(repo.upsert).toHaveBeenCalledWith(
        'hero',
        { vi: null, en: { title: 'Hello' } },
        true,
      );
    });

    it('preserves the OTHER locale when admin saves only one', async () => {
      const { useCase, repo } = buildSut();
      repo.findBySection.mockResolvedValue({
        id: '1',
        data: { vi: { title: 'Xin chào' }, en: { title: 'Hello' } },
      } as never);
      repo.upsert.mockResolvedValue({} as never);

      // Admin only edits Vietnamese — English should be preserved
      await useCase.upsert('hero', { vi: { title: 'Chào mừng' } });

      expect(repo.upsert).toHaveBeenCalledWith(
        'hero',
        { vi: { title: 'Chào mừng' }, en: { title: 'Hello' } },
        true,
      );
    });

    it('allows clearing a locale by passing null', async () => {
      const { useCase, repo } = buildSut();
      repo.findBySection.mockResolvedValue({
        id: '1',
        data: { vi: { title: 'Xin chào' }, en: { title: 'Hello' } },
      } as never);
      repo.upsert.mockResolvedValue({} as never);

      await useCase.upsert('hero', { vi: null });

      expect(repo.upsert).toHaveBeenCalledWith(
        'hero',
        { vi: null, en: { title: 'Hello' } },
        true,
      );
    });

    it('handles existing record with legacy unwrapped data shape', async () => {
      const { useCase, repo } = buildSut();
      // Simulates a row that wasn't migrated (paranoia path)
      repo.findBySection.mockResolvedValue({
        id: '1',
        data: { title: 'Legacy English' },
      } as never);
      repo.upsert.mockResolvedValue({} as never);

      await useCase.upsert('hero', { en: { title: 'New Hello' } });

      // Legacy data is ignored, fresh locales are written
      expect(repo.upsert).toHaveBeenCalledWith(
        'hero',
        { vi: null, en: { title: 'New Hello' } },
        true,
      );
    });
  });
});
