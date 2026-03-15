import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate } from './utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('should merge conflicting tailwind classes', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatCurrency', () => {
  it('should format VND with no decimals', () => {
    const result = formatCurrency(1000000, 'VND');
    // Vietnamese locale formats vary, just check it contains the number
    expect(result).toContain('1.000.000');
  });

  it('should format USD with 2 decimals', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('1,234.56');
  });

  it('should default to VND', () => {
    const result = formatCurrency(500000);
    expect(result).toContain('500.000');
  });
});

describe('formatDate', () => {
  it('should format date in Vietnamese locale', () => {
    const result = formatDate('2026-03-12', 'vi');
    expect(result).toMatch(/12/);
    expect(result).toMatch(/2026/);
  });

  it('should format date in English locale', () => {
    const result = formatDate('2026-03-12', 'en');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2026/);
  });

  it('should accept Date objects', () => {
    const result = formatDate(new Date(2026, 2, 12), 'en');
    expect(result).toMatch(/Mar/);
  });

  it('should default to Vietnamese', () => {
    const result = formatDate('2026-01-01');
    expect(result).toMatch(/2026/);
  });
});
