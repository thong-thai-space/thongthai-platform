'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

// Pattern: State Machine (3 finite states: light → dark → system → light)
const ORDER = ['light', 'dark', 'system'] as const;
type ThemeKey = (typeof ORDER)[number];

// Pattern: Registry (state → icon component)
const ICON: Record<ThemeKey, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations('theme');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const current: ThemeKey = mounted && (ORDER as readonly string[]).includes(theme ?? '')
    ? (theme as ThemeKey)
    : 'system';
  const Icon = ICON[current];

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={t(current)}
      title={t(current)}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
