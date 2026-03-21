/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSectionContent } from '@/hooks/use-content';
import { resolveBackendAssetUrl } from '@/lib/asset-url';

type BrandingContent = {
  name: string;
  logoUrl: string;
  logoAlt?: string;
};

type BrandLogoProps = {
  href: string;
  label?: string;
  className?: string;
  iconClassName?: string;
  imageClassName?: string;
  labelClassName?: string;
};

const DEFAULT_BRANDING: BrandingContent = {
  name: 'Thong Thai Space',
  logoUrl: '',
  logoAlt: 'Thong Thai Space logo',
};

export function BrandLogo({
  href,
  label,
  className,
  iconClassName,
  imageClassName,
  labelClassName,
}: BrandLogoProps) {
  const { data } = useSectionContent('branding');
  const branding = (data?.data as Partial<BrandingContent>) || {};

  const brandName = branding.name || DEFAULT_BRANDING.name;
  const displayLabel = label || brandName;
  const logoAlt = branding.logoAlt || DEFAULT_BRANDING.logoAlt;
  const logoSrc = resolveBackendAssetUrl(branding.logoUrl) || '';

  return (
    <Link href={href} className={cn('flex items-center gap-2', className)}>
      {logoSrc ? (
        <img src={logoSrc} alt={logoAlt} className={cn('h-7 w-auto max-w-32 object-contain', imageClassName)} />
      ) : (
        <Zap className={cn('h-7 w-7 text-primary', iconClassName)} />
      )}
      <span className={cn('text-sm font-bold', labelClassName)}>{displayLabel}</span>
    </Link>
  );
}
