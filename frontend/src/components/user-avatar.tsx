'use client';

import Image from 'next/image';
import { resolveBackendAssetUrl } from '@/lib/asset-url';

export function UserAvatar({
  name,
  avatar,
  size = 'sm',
}: {
  name?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const avatarUrl = resolveBackendAssetUrl(avatar);

  const initial = name?.charAt(0).toUpperCase() || '?';

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name || 'Avatar'}
        width={sizePixels[size]}
        height={sizePixels[size]}
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover`}
        priority={false}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary`}
    >
      {initial}
    </div>
  );
}
