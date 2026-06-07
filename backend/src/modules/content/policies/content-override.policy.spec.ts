import { BadRequestException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { ContentOverridePolicy } from './content-override.policy';
import { MAX_OVERRIDE_BYTES } from '../content.constants';

describe('ContentOverridePolicy', () => {
  const policy = new ContentOverridePolicy();

  describe('parseLocale', () => {
    it('maps supported locales to the Language enum', () => {
      expect(policy.parseLocale('vi')).toBe(Language.VI);
      expect(policy.parseLocale('en')).toBe(Language.EN);
    });

    it('rejects unsupported locales', () => {
      expect(() => policy.parseLocale('fr')).toThrow(BadRequestException);
      expect(() => policy.parseLocale('VI')).toThrow(BadRequestException);
    });
  });

  describe('assertEditableNamespace', () => {
    it('accepts allowlisted namespaces', () => {
      expect(() => policy.assertEditableNamespace('hero')).not.toThrow();
    });

    it('rejects namespaces outside the allowlist', () => {
      expect(() => policy.assertEditableNamespace('theme')).toThrow(
        BadRequestException,
      );
      expect(() => policy.assertEditableNamespace('__proto__')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validatePayload', () => {
    it('accepts strings, string arrays, and nested objects', () => {
      const data = {
        title: 'Xin chào',
        items: {
          web: { title: 'Web', features: ['a', 'b'] },
        },
      };
      expect(policy.validatePayload(data)).toEqual(data);
    });

    it('rejects non-object payloads', () => {
      expect(() => policy.validatePayload('nope')).toThrow(BadRequestException);
      expect(() => policy.validatePayload(null)).toThrow(BadRequestException);
      expect(() => policy.validatePayload(['a'])).toThrow(BadRequestException);
    });

    it('rejects non-string leaf values', () => {
      expect(() => policy.validatePayload({ count: 3 })).toThrow(
        BadRequestException,
      );
      expect(() => policy.validatePayload({ ok: true })).toThrow(
        BadRequestException,
      );
      expect(() => policy.validatePayload({ list: [1, 2] })).toThrow(
        BadRequestException,
      );
      expect(() => policy.validatePayload({ nested: null })).toThrow(
        BadRequestException,
      );
    });

    it('rejects payloads over the size limit', () => {
      const big = { huge: 'x'.repeat(MAX_OVERRIDE_BYTES + 1) };
      expect(() => policy.validatePayload(big)).toThrow(BadRequestException);
    });

    it('rejects payloads nested too deeply', () => {
      let deep: Record<string, unknown> = { value: 'leaf' };
      for (let i = 0; i < 8; i++) deep = { nest: deep };
      expect(() => policy.validatePayload(deep)).toThrow(BadRequestException);
    });
  });
});
