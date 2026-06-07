'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { resolveBackendAssetUrl } from '@/lib/asset-url';

type Props = {
  label: string;
  value?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
};

// Image override widget: preview + upload + clear. Images persist immediately
// (shared across locales) — separate from the text Save button.
export function ImageField({ label, value, uploading, onUpload, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const src = value ? resolveBackendAssetUrl(value) : null;

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-4 rounded-lg border border-border p-3">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {src ? (
            <img src={src} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? 'Đang tải...' : value ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
            {value && (
              <button
                type="button"
                onClick={onRemove}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG/PNG/GIF/WebP, tối đa 5MB. Ảnh dùng chung cho cả hai ngôn ngữ.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </div>
    </div>
  );
}
