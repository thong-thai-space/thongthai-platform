'use client';

import { useAuth } from '@/lib/auth';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { UserAvatar } from '@/components/user-avatar';
import { motion, useReducedMotion } from 'framer-motion';

export function PortalHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.header
      initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-14 items-center justify-between border-b border-border bg-background px-6"
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <div className="flex items-center gap-2">
          <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" />
          <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
        </div>
      </div>
    </motion.header>
  );
}
