'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MemberSidebar } from '@/components/member/sidebar';
import { PushNotificationPrompt } from '@/components/push-notification-prompt';

export default function MemberLayout({
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
    if (!loading && user && user.role !== 'MEMBER') {
      if (user.role === 'CLIENT') router.push('/portal');
      else router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'MEMBER') return null;

  return (
    <div className="tts-workspace-shell flex h-screen overflow-hidden">
      <MemberSidebar />
      <div className="tts-workspace flex flex-1 flex-col overflow-hidden" data-role="MEMBER">
        <PushNotificationPrompt />
        <div className="tts-workspace-content flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
