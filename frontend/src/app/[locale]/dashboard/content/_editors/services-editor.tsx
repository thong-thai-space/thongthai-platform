/* eslint-disable @next/next/no-img-element */
'use client';

import { Plus, Upload } from 'lucide-react';
import { isObjectValue, resolveAssetUrl } from '../_helpers/content-template';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ServiceItemData = {
  icon: string;
  title: string;
  description: string;
  features: string[];
  imageUrl: string;
};

export type ServicesSectionData = {
  title: string;
  subtitle: string;
  items: ServiceItemData[];
};

// ─── Fallback (used when CMS returns nothing) ────────────────────────────────

const FALLBACK: ServicesSectionData = {
  title: 'Our Services',
  subtitle: 'Comprehensive technology solutions, from idea to finished product',
  items: [
    {
      icon: 'Globe',
      title: 'Web Development',
      description: 'Websites, web apps, and e-commerce with modern technology.',
      features: ['Landing page', 'Web application'],
      imageUrl: '',
    },
  ],
};

// ─── Normalizer ──────────────────────────────────────────────────────────────

/**
 * Coerces an unknown CMS payload into a fully-typed ServicesSectionData,
 * filling missing or mistyped fields from FALLBACK.
 */
export function toServicesSectionData(value: unknown): ServicesSectionData {
  if (!isObjectValue(value)) return FALLBACK;

  const title = typeof value.title === 'string' ? value.title : FALLBACK.title;
  const subtitle = typeof value.subtitle === 'string' ? value.subtitle : FALLBACK.subtitle;
  const items: ServiceItemData[] = Array.isArray(value.items)
    ? value.items
        .map((item): ServiceItemData | null => {
          if (!isObjectValue(item)) return null;
          return {
            icon: typeof item.icon === 'string' ? item.icon : 'Globe',
            title: typeof item.title === 'string' ? item.title : '',
            description: typeof item.description === 'string' ? item.description : '',
            features: Array.isArray(item.features)
              ? item.features.map((f) => String(f)).filter(Boolean)
              : [],
            imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
          };
        })
        .filter((item): item is ServiceItemData => item !== null)
    : FALLBACK.items;

  return { title, subtitle, items };
}

// ─── Visual Editor component ─────────────────────────────────────────────────

export function ServicesVisualEditor({
  value,
  onChange,
  onUploadImage,
  uploadingKey,
}: {
  value: unknown;
  onChange: (v: ServicesSectionData) => void;
  onUploadImage: (file: File, key: string) => Promise<string | undefined>;
  uploadingKey: string;
}) {
  const data = toServicesSectionData(value);

  const updateItem = (index: number, patch: Partial<ServiceItemData>) => {
    onChange({
      ...data,
      items: data.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  };

  const addItem = () => {
    onChange({
      ...data,
      items: [
        ...data.items,
        { icon: 'Globe', title: '', description: '', features: [], imageUrl: '' },
      ],
    });
  };

  const removeItem = (index: number) => {
    onChange({
      ...data,
      items: data.items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Section Title</span>
          <input
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subtitle</span>
          <textarea
            value={data.subtitle}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
            rows={2}
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Services ({data.items.length})</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add Service
          </button>
        </div>

        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services yet.</p>
        ) : (
          <div className="space-y-3">
            {data.items.map((item, index) => {
              const key = `service-${index}`;
              return (
                <div key={key} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Service #{index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Icon (Globe/Smartphone/Brain/MessageSquare)
                      </span>
                      <input
                        value={item.icon}
                        onChange={(e) => updateItem(index, { icon: e.target.value })}
                        className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</span>
                      <input
                        value={item.title}
                        onChange={(e) => updateItem(index, { title: e.target.value })}
                        className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</span>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        rows={2}
                        className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Features (comma separated)
                      </span>
                      <input
                        value={item.features.join(', ')}
                        onChange={(e) =>
                          updateItem(index, {
                            features: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>

                    <div className="space-y-1.5 md:col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Service Image
                      </span>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {item.imageUrl ? (
                          <img
                            src={resolveAssetUrl(item.imageUrl)}
                            alt={item.title || 'Service preview'}
                            className="h-24 w-40 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                            <Upload className="h-4 w-4" />
                            {uploadingKey === key ? 'Uploading...' : 'Upload image'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const url = await onUploadImage(file, key);
                                if (url) updateItem(index, { imageUrl: url });
                              }}
                            />
                          </label>
                          <input
                            value={item.imageUrl}
                            onChange={(e) => updateItem(index, { imageUrl: e.target.value })}
                            placeholder="Or paste image URL"
                            className="tts-form-field min-w-72 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
