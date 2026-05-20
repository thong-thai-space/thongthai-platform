'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { PushNotificationPrompt } from '@/components/push-notification-prompt';

export default function DashboardLayout({
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
    if (!loading && user?.role === 'CLIENT') {
      router.push('/portal');
    }
    if (!loading && user?.role === 'MEMBER') {
      router.push('/member');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role === 'CLIENT' || user.role === 'MEMBER') return null;

  const roleMotion = user.role === 'OWNER' ? 'OWNER' : 'ADMIN';

  return (
    <div className="tts-workspace-shell flex h-screen overflow-hidden">
      <Sidebar />
      <div className="tts-workspace flex flex-1 flex-col overflow-hidden" data-role={roleMotion}>
        <PushNotificationPrompt />
        <div className="tts-workspace-content flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
