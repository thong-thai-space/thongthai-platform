'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useAuth } from '@/lib/auth';

const DISMISS_KEY = 'push-prompt-dismissed';

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    setDismissed(!!wasDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleEnable = async () => {
    await subscribe();
    setDismissed(true);
  };

  // Don't show if: not logged in, already subscribed, already denied, unsupported, or dismissed
  if (!user || isSubscribed || permission === 'denied' || permission === 'unsupported' || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex items-center justify-between gap-3 border-b border-border bg-primary/5 px-4 py-2.5"
      >
        <div className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-primary" />
          <span>Enable notifications to receive real-time updates on projects, tasks, and messages.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
