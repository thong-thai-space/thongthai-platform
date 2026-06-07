import { BadRequestException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { ContentUseCases } from './content.use-cases';
import { ContentOverridePolicy } from '../policies/content-override.policy';
import type {
  ContentRepositoryPort,
  NamespaceOverride,
} from '../domain/content.repository.port';

describe('ContentUseCases', () => {
  let repo: jest.Mocked<ContentRepositoryPort>;
  let storage: { uploadPublicFile: jest.Mock };
  let useCases: ContentUseCases;

  beforeEach(() => {
    repo = {
      findByLocale: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
      remove: jest.fn(),
    };
    storage = { uploadPublicFile: jest.fn() };
    // Use the real policy — its rules are part of the use-case contract.
    useCases = new ContentUseCases(
      repo,
      new ContentOverridePolicy(),
      storage as never,
    );
  });

  describe('getOverridesForLocale', () => {
    it('maps rows into a { namespace: data } object', async () => {
      const rows: NamespaceOverride[] = [
        { namespace: 'hero', data: { title: 'Xin chào' } },
        { namespace: 'cta', data: { primary: 'Nhận báo giá' } },
      ];
      repo.findByLocale.mockResolvedValue(rows);

      const result = await useCases.getOverridesForLocale('vi');

      expect(repo.findByLocale).toHaveBeenCalledWith(Language.VI);
      expect(result).toEqual({
        hero: { title: 'Xin chào' },
        cta: { primary: 'Nhận báo giá' },
      });
    });

    it('rejects an unsupported locale before hitting the repo', async () => {
      await expect(useCases.getOverridesForLocale('de')).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.findByLocale).not.toHaveBeenCalled();
    });
  });

  describe('upsertOverride', () => {
    it('validates then persists with the mapped locale', async () => {
      await useCases.upsertOverride('en', 'hero', { title: 'Hello' });

      expect(repo.upsert).toHaveBeenCalledWith(
        'hero',
        Language.EN,
        { title: 'Hello' },
      );
    });

    it('rejects a non-editable namespace before persisting', async () => {
      await expect(
        useCases.upsertOverride('vi', 'theme', { light: 'x' }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.upsert).not.toHaveBeenCalled();
    });

    it('rejects an invalid payload before persisting', async () => {
      await expect(
        useCases.upsertOverride('vi', 'hero', { count: 5 }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.upsert).not.toHaveBeenCalled();
    });
  });

  describe('removeOverride', () => {
    it('removes the override for the mapped locale', async () => {
      await useCases.removeOverride('vi', 'footer');
      expect(repo.remove).toHaveBeenCalledWith('footer', Language.VI);
    });

    it('rejects a non-editable namespace', async () => {
      await expect(
        useCases.removeOverride('vi', 'nope'),
      ).rejects.toThrow(BadRequestException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe('setImage', () => {
    const file = { mimetype: 'image/png' } as Express.Multer.File;

    it('uploads then writes the URL into a nested field for EVERY locale', async () => {
      storage.uploadPublicFile.mockResolvedValue('https://cdn/x.png');
      repo.findOne.mockResolvedValue({ title: 'keep me' });

      const result = await useCases.setImage(
        'services',
        'items.web.imageUrl',
        file,
      );

      expect(result).toEqual({ url: 'https://cdn/x.png' });
      // Written for both VI and EN, preserving existing content.
      expect(repo.upsert).toHaveBeenCalledTimes(2);
      expect(repo.upsert).toHaveBeenCalledWith('services', Language.VI, {
        title: 'keep me',
        items: { web: { imageUrl: 'https://cdn/x.png' } },
      });
      expect(repo.upsert).toHaveBeenCalledWith('services', Language.EN, {
        title: 'keep me',
        items: { web: { imageUrl: 'https://cdn/x.png' } },
      });
    });

    it('rejects a field that is not a registered image field', async () => {
      await expect(
        useCases.setImage('hero', 'title', file),
      ).rejects.toThrow(BadRequestException);
      expect(storage.uploadPublicFile).not.toHaveBeenCalled();
    });
  });

  describe('removeImage', () => {
    it('clears the image field across all locales, deleting empty rows', async () => {
      repo.findOne.mockResolvedValue({ imageUrl: 'https://cdn/x.png' });

      await useCases.removeImage('hero', 'imageUrl');

      // After removing the only key the row is empty -> deleted.
      expect(repo.remove).toHaveBeenCalledWith('hero', Language.VI);
      expect(repo.remove).toHaveBeenCalledWith('hero', Language.EN);
      expect(repo.upsert).not.toHaveBeenCalled();
    });

    it('keeps other fields when clearing an image', async () => {
      repo.findOne.mockResolvedValue({
        title: 'Hero',
        imageUrl: 'https://cdn/x.png',
      });

      await useCases.removeImage('hero', 'imageUrl');

      expect(repo.upsert).toHaveBeenCalledWith('hero', Language.VI, {
        title: 'Hero',
      });
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
