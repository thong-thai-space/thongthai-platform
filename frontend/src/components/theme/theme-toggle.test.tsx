/**
 * ThemeToggle — state-machine cycling tests
 *
 * The core behaviour under test is the 3-state cycle: light → dark → system → light.
 * Everything else (hydration guard, icon rendering) is secondary and tested lightly.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeToggle } from './theme-toggle';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSetTheme = vi.fn();
let mockTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderToggle() {
  return render(<ThemeToggle />);
}

function clickToggle() {
  fireEvent.click(screen.getByRole('button'));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ThemeToggle — state machine', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('light → dark on first click', () => {
    mockTheme = 'light';
    renderToggle();
    clickToggle();
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('dark → system on click', () => {
    mockTheme = 'dark';
    renderToggle();
    clickToggle();
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('system → light on click (wraps around)', () => {
    mockTheme = 'system';
    renderToggle();
    clickToggle();
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme exactly once per click', () => {
    mockTheme = 'light';
    renderToggle();
    clickToggle();
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });
});

describe('ThemeToggle — hydration guard', () => {
  it('renders a button without throwing (mounted guard fires via useEffect)', () => {
    mockTheme = 'light';
    renderToggle();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('falls back to system state for unknown theme values', () => {
    // If theme is an unrecognised string, current should default to "system"
    mockTheme = 'custom-unknown-theme';
    renderToggle();
    // After mount, ORDER.includes('custom-unknown-theme') is false → current = 'system'
    // system → light on click
    clickToggle();
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
