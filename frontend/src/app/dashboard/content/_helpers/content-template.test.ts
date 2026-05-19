import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/asset-url', () => ({
  getApiOrigin: () => 'https://cdn.example.com',
}));

import {
  buildDefaultFromTemplate,
  extractPortfolioCategories,
  isObjectValue,
  normalizeByTemplate,
  resolveAssetUrl,
  toDisplayLabel,
} from './content-template';

describe('toDisplayLabel', () => {
  it('camelCase → Title Case', () => {
    expect(toDisplayLabel('heroTitle')).toBe('Hero Title');
  });
  it('handles underscores and hyphens', () => {
    expect(toDisplayLabel('public_faq-prompt')).toBe('Public faq prompt');
  });
  it('handles single chars', () => {
    expect(toDisplayLabel('x')).toBe('X');
  });
});

describe('isObjectValue', () => {
  it('returns true for plain object', () => {
    expect(isObjectValue({ a: 1 })).toBe(true);
  });
  it('returns false for array', () => {
    expect(isObjectValue([])).toBe(false);
  });
  it('returns false for null', () => {
    expect(isObjectValue(null)).toBe(false);
  });
  it('returns false for primitive', () => {
    expect(isObjectValue('hello')).toBe(false);
  });
});

describe('buildDefaultFromTemplate', () => {
  it('returns empty array for array template', () => {
    expect(buildDefaultFromTemplate([1, 2, 3])).toEqual([]);
  });
  it('zeros out numbers, empties strings, falses booleans', () => {
    expect(buildDefaultFromTemplate({ count: 5, label: 'x', on: true })).toEqual({
      count: 0,
      label: '',
      on: false,
    });
  });
  it('recurses into nested objects', () => {
    expect(buildDefaultFromTemplate({ outer: { inner: 'x' } })).toEqual({
      outer: { inner: '' },
    });
  });
});

describe('normalizeByTemplate', () => {
  it('returns template when value type mismatches', () => {
    expect(normalizeByTemplate('not array', [1])).toEqual([1]);
    expect(normalizeByTemplate(123, { a: 1 })).toEqual({ a: 1 });
  });

  it('preserves existing keys + adds missing ones from template', () => {
    const result = normalizeByTemplate(
      { kept: 'hello' },
      { kept: 'default', added: 0 },
    );
    expect(result).toEqual({ kept: 'hello', added: 0 });
  });

  it('normalizes arrays using the first template item as shape', () => {
    const result = normalizeByTemplate(
      [{ name: 'A' }, { name: 'B' }],
      [{ name: '', extra: 0 }],
    );
    expect(result).toEqual([
      { name: 'A', extra: 0 },
      { name: 'B', extra: 0 },
    ]);
  });
});

describe('extractPortfolioCategories', () => {
  it('returns empty array for non-object', () => {
    expect(extractPortfolioCategories(null)).toEqual([]);
    expect(extractPortfolioCategories('a')).toEqual([]);
  });
  it('returns categories when present', () => {
    expect(extractPortfolioCategories({ categories: ['Web', 'AI'] })).toEqual([
      'Web',
      'AI',
    ]);
  });
  it('coerces non-string values', () => {
    expect(extractPortfolioCategories({ categories: [1, '', 'Web'] })).toEqual([
      '1',
      'Web',
    ]);
  });
});

describe('resolveAssetUrl', () => {
  it('returns empty for falsy input', () => {
    expect(resolveAssetUrl()).toBe('');
    expect(resolveAssetUrl('')).toBe('');
  });
  it('passes through absolute URLs', () => {
    expect(resolveAssetUrl('https://elsewhere/img.png')).toBe('https://elsewhere/img.png');
  });
  it('prepends API origin to relative paths', () => {
    expect(resolveAssetUrl('/uploads/x.png')).toBe('https://cdn.example.com/uploads/x.png');
  });
});
