import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CommonProps = {
  children: ReactNode;
  className?: string;
};

export function BrandSection({ children, className }: CommonProps) {
  return <section className={cn('py-20 sm:py-28', className)}>{children}</section>;
}

export function BrandContainer({ children, className }: CommonProps) {
  return <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function BrandHeroContainer({ children, className }: CommonProps) {
  return <div className={cn('mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function BrandSurface({ children, className }: CommonProps) {
  return <div className={cn('tts-brand-surface', className)}>{children}</div>;
}

export function BrandKicker({ children, className }: CommonProps) {
  return <div className={cn('tts-brand-kicker', className)}>{children}</div>;
}
