import {
  estimateCostUsd,
  isProviderUnavailableError,
  maskSensitiveData,
  roleDirective,
  toTaskPriority,
  tryParseJson,
} from './ai-content.helpers';

describe('AI content helpers', () => {
  describe('tryParseJson', () => {
    it('parses raw JSON', () => {
      expect(tryParseJson('{"a":1}')).toEqual({ a: 1 });
    });

    it('extracts JSON from fenced code block', () => {
      const text = 'prefix\n```json\n{"a":1}\n```\nsuffix';
      expect(tryParseJson(text)).toEqual({ a: 1 });
    });

    it('returns { raw } on parse failure', () => {
      expect(tryParseJson('not json')).toEqual({ raw: 'not json' });
    });
  });

  describe('maskSensitiveData', () => {
    it('masks email', () => {
      expect(maskSensitiveData('contact me at a@b.com')).toContain('[EMAIL]');
    });

    it('masks phone', () => {
      expect(maskSensitiveData('call 0987654321')).toContain('[PHONE]');
    });

    it('masks long numeric IDs', () => {
      expect(maskSensitiveData('id 1234567890')).toContain('[ID]');
    });
  });

  describe('toTaskPriority', () => {
    it('returns HIGH for HIGH input', () => {
      expect(toTaskPriority('HIGH')).toBe('HIGH');
    });
    it('returns LOW for LOW input', () => {
      expect(toTaskPriority('LOW')).toBe('LOW');
    });
    it('defaults to MEDIUM', () => {
      expect(toTaskPriority()).toBe('MEDIUM');
      expect(toTaskPriority('weird')).toBe('MEDIUM');
    });
  });

  describe('roleDirective', () => {
    it('returns empty string for undefined role', () => {
      expect(roleDirective()).toBe('');
    });
  });

  describe('estimateCostUsd', () => {
    it('returns 0 with no tokens', () => {
      expect(estimateCostUsd(0, 0)).toBe(0);
    });

    it('charges $3 per 1M input tokens', () => {
      expect(estimateCostUsd(1_000_000, 0)).toBeCloseTo(3, 5);
    });

    it('charges $15 per 1M output tokens', () => {
      expect(estimateCostUsd(0, 1_000_000)).toBeCloseTo(15, 5);
    });
  });

  describe('isProviderUnavailableError', () => {
    it('returns true on 429', () => {
      expect(isProviderUnavailableError({ status: 429 })).toBe(true);
    });

    it('returns true on 5xx', () => {
      expect(isProviderUnavailableError({ statusCode: 503 })).toBe(true);
    });

    it('returns true on ECONNRESET', () => {
      expect(isProviderUnavailableError({ code: 'ECONNRESET' })).toBe(true);
    });

    it('returns true on timeout message', () => {
      expect(isProviderUnavailableError(new Error('request timeout'))).toBe(
        true,
      );
    });

    it('returns false on plain validation error', () => {
      expect(isProviderUnavailableError(new Error('bad request'))).toBe(false);
    });
  });
});
