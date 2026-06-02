'use client';

import { useState } from 'react';
import { useAdminPlaybooks } from '@/hooks/use-academy';
import type { PlaybookStatus } from '@/types';
import { PlaybookList } from './playbook-list';
import { PlaybookEditor } from './playbook-editor';
import { PlaybookAssignees } from './playbook-assignees';

/**
 * Pattern: Client Island — composition root for Academy authoring. Holds the
 * selection + filter state; the admin list returns full playbooks (content
 * included), so the editor reads from the list rather than re-fetching.
 */
export function AcademyWorkspace() {
  const [filter, setFilter] = useState<PlaybookStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useAdminPlaybooks(
    filter === 'ALL' ? undefined : filter,
  );
  const items = data?.items ?? [];
  const selected = items.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Playbooks</h2>
        <PlaybookList
          items={items}
          isLoading={isLoading}
          selectedId={selectedId}
          filter={filter}
          onFilter={setFilter}
          onSelect={(id) => {
            setSelectedId(id);
            setCreating(false);
          }}
          onNew={() => {
            setCreating(true);
            setSelectedId(null);
          }}
        />
      </section>

      <div className="space-y-4">
        {creating || selected ? (
          <>
            <PlaybookEditor
              key={selected?.id ?? 'new'}
              playbook={creating ? null : selected}
              onCreated={(id) => {
                setCreating(false);
                setSelectedId(id);
              }}
              onDeleted={() => {
                setSelectedId(null);
                setCreating(false);
              }}
            />
            {selected && !creating && <PlaybookAssignees playbook={selected} />}
          </>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Select a playbook to edit, or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
