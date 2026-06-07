'use client';

import { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import {
  EDITABLE_NAMESPACES,
  IMAGE_FIELDS,
  NAMESPACE_LABELS,
  getNamespaceDefaults,
  type EditableNamespace,
  type EditorLocale,
} from '@/lib/cms-namespaces';
import {
  useContentOverrides,
  useRemoveContentImage,
  useResetOverride,
  useUpdateOverride,
  useUploadContentImage,
} from '@/hooks/use-content';
import { NamespaceEditor } from './_components/namespace-editor';

const LOCALES: { value: EditorLocale; label: string }[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

export default function ContentEditorPage() {
  const [locale, setLocale] = useState<EditorLocale>('vi');
  const [namespace, setNamespace] = useState<EditableNamespace>(
    EDITABLE_NAMESPACES[0],
  );
  const [uploadingPath, setUploadingPath] = useState<string | null>(null);

  const { data: overrides = {}, isLoading } = useContentOverrides(locale);
  const updateOverride = useUpdateOverride();
  const resetOverride = useResetOverride();
  const uploadImage = useUploadContentImage();
  const removeImage = useRemoveContentImage();

  const defaults = useMemo(
    () => getNamespaceDefaults(locale, namespace),
    [locale, namespace],
  );
  const imageFields = IMAGE_FIELDS[namespace] ?? [];

  // An empty override object ({}) is equivalent to "no override".
  const hasOverride = (ns: string) => {
    const value = overrides[ns];
    return Boolean(value && Object.keys(value).length > 0);
  };

  const handleUploadImage = (field: string, file: File) => {
    setUploadingPath(field);
    uploadImage.mutate(
      { namespace, field, file },
      { onSettled: () => setUploadingPath(null) },
    );
  };

  // Mark the field busy during removal too, so text Save/Reset can't race the
  // in-flight image mutation (and restore a just-deleted image).
  const handleRemoveImage = (field: string) => {
    setUploadingPath(field);
    removeImage.mutate(
      { namespace, field },
      { onSettled: () => setUploadingPath(null) },
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Nội dung website (CMS)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chỉnh sửa nội dung hiển thị của trang công khai theo từng ngôn ngữ. Bỏ
          trống một ô để dùng lại nội dung mặc định (gợi ý là chữ xám trong ô).
          Ảnh dùng chung cho cả hai ngôn ngữ.
        </p>
      </header>

      {/* Locale tabs */}
      <div className="mb-6 inline-flex rounded-lg border border-border p-1">
        {LOCALES.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => setLocale(l.value)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              locale === l.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Namespace list */}
        <nav className="space-y-1">
          {EDITABLE_NAMESPACES.map((ns) => (
            <button
              key={ns}
              type="button"
              onClick={() => setNamespace(ns)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                namespace === ns
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{NAMESPACE_LABELS[ns]}</span>
              {hasOverride(ns) && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  title="Đã có nội dung tùy chỉnh"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Editor — remounts per (locale, namespace) so its draft re-initializes */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <NamespaceEditor
            key={`${locale}:${namespace}`}
            title={NAMESPACE_LABELS[namespace]}
            defaults={defaults}
            initialOverride={overrides[namespace] ?? {}}
            hasOverride={hasOverride(namespace)}
            imageFields={imageFields}
            uploadingPath={uploadingPath}
            isSaving={updateOverride.isPending}
            isResetting={resetOverride.isPending}
            onSave={(data) =>
              updateOverride.mutateAsync({ locale, namespace, data })
            }
            onReset={() => resetOverride.mutateAsync({ locale, namespace })}
            onUploadImage={handleUploadImage}
            onRemoveImage={handleRemoveImage}
          />
        )}
      </div>
    </div>
  );
}
