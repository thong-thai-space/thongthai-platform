'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Languages } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('language');

  const onChange = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 px-1 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
        isPending && 'opacity-70',
        className,
      )}
      role="group"
      aria-label={t('label')}
    >
      <Languages className="mx-1 h-3.5 w-3.5 opacity-60" />
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={locale === l}
          className={cn(
            'rounded-full px-2 py-1 uppercase tracking-wide transition-colors',
            locale === l
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-slate-100 dark:hover:bg-white/10',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
