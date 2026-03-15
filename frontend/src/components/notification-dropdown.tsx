'use client';

import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Notification } from '@/types';

const typeIcons: Record<string, string> = {
  TASK_ASSIGNED: '📋',
  TASK_UPDATED: '✏️',
  PROJECT_UPDATE: '📁',
  PROJECT_REQUEST: '📨',
  CONTACT_REQUEST: '📩',
  INVOICE_PAID: '💰',
  CLIENT_MESSAGE: '💬',
  AI_COMPLETED: '🤖',
  SYSTEM: '🔔',
};

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const count = typeof unreadCount === 'number' ? unreadCount : 0;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-background shadow-lg sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && (!notifications || notifications.length === 0) && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No notifications.
              </div>
            )}

            {notifications?.map((n: Notification) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 ${
                  !n.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <span className="mt-0.5 text-base">
                  {typeIcons[n.type] || '🔔'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {n.message}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2 text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
