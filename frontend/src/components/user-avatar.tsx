'use client';

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

  const avatarUrl = resolveBackendAssetUrl(avatar);

  const initial = name?.charAt(0).toUpperCase() || '?';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover`}
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
