'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

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

  const avatarUrl = avatar
    ? avatar.startsWith('http')
      ? avatar
      : `${API_BASE}${avatar}`
    : null;

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
