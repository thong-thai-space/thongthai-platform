'use client';

import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { deepMerge } from '@/lib/deep-merge';
import { NamespaceFields } from './namespace-fields';
import {
  omitPaths,
  pickPaths,
  prune,
  setIn,
  type DraftValue,
} from './draft-utils';

type Props = {
  title: string;
  defaults: Record<string, unknown>;
  initialOverride: Record<string, unknown>;
  hasOverride: boolean;
  imageFields: string[];
  uploadingPath: string | null;
  isSaving: boolean;
  isResetting: boolean;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onReset: () => Promise<void>;
  onUploadImage: (field: string, file: File) => void;
  onRemoveImage: (field: string) => void;
};

// Holds the editable TEXT draft for one (namespace, locale). Image fields are kept
// out of the draft — they're managed separately (shared across locales, persisted
// immediately). Because PUT replaces the whole row, text writes re-merge the
// current images so an image is never wiped by a text save/reset.
export function NamespaceEditor({
  title,
  defaults,
  initialOverride,
  hasOverride,
  imageFields,
  uploadingPath,
  isSaving,
  isResetting,
  onSave,
  onReset,
  onUploadImage,
  onRemoveImage,
}: Props) {
  const [draft, setDraft] = useState<Record<string, unknown>>(() =>
    omitPaths(initialOverride, imageFields),
  );
  const [saved, setSaved] = useState(false);

  // An image upload/remove is in flight — block text Save/Reset so a whole-row
  // PUT/DELETE can't clobber or restore the image mid-operation.
  const imageBusy = uploadingPath !== null;

  const handleChange = (path: string[], value: DraftValue) => {
    setSaved(false);
    setDraft((prev) => setIn(prev, path, value));
  };

  const handleSave = async () => {
    // Merge the persisted images back in so the text PUT doesn't drop them.
    const payload = deepMerge(prune(draft), pickPaths(initialOverride, imageFields));
    if (Object.keys(payload).length === 0) {
      await onReset();
    } else {
      await onSave(payload);
    }
    setSaved(true);
  };

  const handleReset = async () => {
    // Reset clears text but preserves images (shared across locales).
    const images = pickPaths(initialOverride, imageFields);
    if (Object.keys(images).length > 0) {
      await onSave(images);
    } else {
      await onReset();
    }
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
            disabled={isResetting || !hasOverride || imageBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || imageBusy}
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
        imageFields={new Set(imageFields)}
        savedOverride={initialOverride}
        uploadingPath={uploadingPath}
        onUploadImage={(path, file) => onUploadImage(path.join('.'), file)}
        onRemoveImage={(path) => onRemoveImage(path.join('.'))}
      />
    </section>
  );
}
