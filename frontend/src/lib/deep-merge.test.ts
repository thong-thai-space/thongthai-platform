import { describe, expect, it } from 'vitest';
import { deepMerge } from './deep-merge';

describe('deepMerge', () => {
  it('returns the base unchanged when there is no override', () => {
    const base = { a: '1', b: { c: '2' } };
    expect(deepMerge(base, undefined)).toEqual(base);
    expect(deepMerge(base, null)).toEqual(base);
    expect(deepMerge(base, {})).toEqual(base);
  });

  it('overrides only the provided leaves and keeps the rest as defaults', () => {
    const base = { title: 'EN title', subtitle: 'EN subtitle' };
    const result = deepMerge(base, { title: 'VI title' });
    expect(result).toEqual({ title: 'VI title', subtitle: 'EN subtitle' });
  });

  it('merges nested objects recursively', () => {
    const base = {
      items: { web: { title: 'Web', desc: 'Web desc' }, ai: { title: 'AI' } },
    };
    const result = deepMerge(base, { items: { web: { title: 'Trang web' } } });
    expect(result).toEqual({
      items: {
        web: { title: 'Trang web', desc: 'Web desc' },
        ai: { title: 'AI' },
      },
    });
  });

  it('replaces arrays wholesale rather than merging them', () => {
    const base = { features: ['a', 'b', 'c'] };
    const result = deepMerge(base, { features: ['x'] });
    expect(result).toEqual({ features: ['x'] });
  });

  it('does not mutate the base object', () => {
    const base = { nested: { value: 'original' } };
    deepMerge(base, { nested: { value: 'changed' } });
    expect(base.nested.value).toBe('original');
  });
});
