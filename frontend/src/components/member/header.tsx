'use client';

import { useAuth } from '@/lib/auth';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { UserAvatar } from '@/components/user-avatar';

export function MemberHeader({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <div className="flex items-center gap-2">
          <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" />
          <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
