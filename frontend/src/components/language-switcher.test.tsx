/**
 * LanguageSwitcher — locale switching behaviour tests
 *
 * Tests focus on:
 *   1. Correct aria-pressed state for active / inactive locales
 *   2. router.replace called with correct locale on switch
 *   3. No navigation when the already-active locale is clicked
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LanguageSwitcher } from './language-switcher';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockReplace = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/about',
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'vi',
  useTranslations: () => (key: string) => key,
}));

// Keep routing.locales in sync with the real routing config
vi.mock('@/i18n/routing', () => ({
  routing: { locales: ['vi', 'en'] },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('marks the current locale as active (aria-pressed="true")', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: /^vi$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks non-current locale as inactive (aria-pressed="false")', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: /^en$/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls router.replace with the new locale when a non-active locale is clicked', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /^en$/i }));
    expect(mockReplace).toHaveBeenCalledWith('/about', { locale: 'en' });
  });

  it('does NOT navigate when the already-active locale is clicked', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /^vi$/i }));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders a labelled group containing both locale buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
  });
});
