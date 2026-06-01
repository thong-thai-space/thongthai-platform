'use client';

import { PortalHeader } from '@/components/portal/header';
import { MyPlaybooks } from '@/components/portal/academy/my-playbooks';

export default function PortalAcademyPage() {
  return (
    <>
      <PortalHeader title="Playbooks" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Your AI-usage playbooks — practical guides and prompt templates
            shared by Thong Thai Space. Open one to read it and track your
            progress.
          </p>
        </div>
        <MyPlaybooks />
      </main>
    </>
  );
}
