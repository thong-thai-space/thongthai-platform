'use client';

import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { NamespaceFields } from './namespace-fields';
import { prune, setIn, type DraftValue } from './draft-utils';

type Props = {
  title: string;
  defaults: Record<string, unknown>;
  initialOverride: Record<string, unknown>;
  hasOverride: boolean;
  isSaving: boolean;
  isResetting: boolean;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onReset: () => Promise<void>;
};

function clone(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value));
}

// Holds the editable draft for one (namespace, locale). The parent remounts this
// via a `key`, so the draft initializes straight from props — no syncing effect,
// and switching target never mixes one locale's edits into another.
export function NamespaceEditor({
  title,
  defaults,
  initialOverride,
  hasOverride,
  isSaving,
  isResetting,
  onSave,
  onReset,
}: Props) {
  const [draft, setDraft] = useState<Record<string, unknown>>(() =>
    clone(initialOverride),
  );
  const [saved, setSaved] = useState(false);

  const handleChange = (path: string[], value: DraftValue) => {
    setSaved(false);
    setDraft((prev) => setIn(prev, path, value));
  };

  const handleSave = async () => {
    await onSave(prune(draft));
    setSaved(true);
  };

  const handleReset = async () => {
    await onReset();
    setDraft({});
    setSaved(false);
  };

  return (
    <section className="rounded-xl border border-border p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || !hasOverride}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {saved && (
        <p className="mb-4 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          Đã lưu. Nội dung mới sẽ hiển thị trên trang công khai ngay lập tức.
        </p>
      )}

      <NamespaceFields
        defaults={defaults}
        draft={draft}
        onChange={handleChange}
      />
    </section>
  );
}
