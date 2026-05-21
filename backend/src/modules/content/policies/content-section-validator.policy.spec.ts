import { BadRequestException } from '@nestjs/common';
import { MAX_CONTENT_PAYLOAD_BYTES } from '../content.constants';
import { ContentSectionValidator } from './content-section-validator.policy';

describe('ContentSectionValidator', () => {
  const validator = new ContentSectionValidator();

  describe('section + payload base validation', () => {
    it('rejects unknown sections', () => {
      expect(() =>
        validator.validate('not-a-real-section', { en: {} }),
      ).toThrow(BadRequestException);
    });

    it('rejects null payloads', () => {
      expect(() => validator.validate('hero', null)).toThrow(
        BadRequestException,
      );
    });

    it('rejects array payloads', () => {
      expect(() => validator.validate('hero', [])).toThrow(BadRequestException);
    });

    it('rejects primitive payloads', () => {
      expect(() => validator.validate('hero', 'a string')).toThrow(
        BadRequestException,
      );
    });

    it('rejects payloads exceeding the size cap', () => {
      const huge = {
        en: { blob: 'x'.repeat(MAX_CONTENT_PAYLOAD_BYTES + 100) },
      };
      expect(() => validator.validate('hero', huge)).toThrow(/exceeds/);
    });
  });

  describe('per-locale envelope', () => {
    it('accepts envelope with both vi and en', () => {
      expect(() =>
        validator.validate('hero', {
          vi: { title: 'Xin chào' },
          en: { title: 'Hello' },
        }),
      ).not.toThrow();
    });

    it('accepts envelope with only en', () => {
      expect(() =>
        validator.validate('hero', { en: { title: 'Hello' } }),
      ).not.toThrow();
    });

    it('accepts envelope with only vi', () => {
      expect(() =>
        validator.validate('hero', { vi: { title: 'Xin chào' } }),
      ).not.toThrow();
    });

    it('accepts a locale set to null (frontend falls back to i18n)', () => {
      expect(() =>
        validator.validate('hero', { en: { title: 'Hello' }, vi: null }),
      ).not.toThrow();
    });

    it('rejects envelope with NO locale keys', () => {
      expect(() =>
        validator.validate('hero', { title: 'untranslated' }),
      ).toThrow(/locale key/i);
    });

    it('rejects envelope with unknown top-level keys', () => {
      expect(() =>
        validator.validate('hero', {
          en: { title: 'Hello' },
          fr: { title: 'Bonjour' },
        }),
      ).toThrow(/unknown top-level keys/i);
    });

    it('rejects a locale body that is an array', () => {
      expect(() =>
        validator.validate('hero', { en: ['not', 'an', 'object'] }),
      ).toThrow(/must be a JSON object or null/);
    });

    it('rejects a locale body that is a primitive', () => {
      expect(() => validator.validate('hero', { en: 'just a string' })).toThrow(
        /must be a JSON object or null/,
      );
    });
  });
});
