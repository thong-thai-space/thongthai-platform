'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PortalSidebar } from '@/components/portal/sidebar';
import { AiChatWidget } from '@/components/portal/ai-chat-widget';
import { PushNotificationPrompt } from '@/components/push-notification-prompt';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && user.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'CLIENT') return null;

  return (
    <div className="tts-workspace-shell flex h-screen overflow-hidden">
      <PortalSidebar />
      <div className="tts-workspace flex flex-1 flex-col overflow-hidden" data-role="CLIENT">
        <PushNotificationPrompt />
        <div className="tts-workspace-content flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
      <AiChatWidget />
    </div>
  );
}
