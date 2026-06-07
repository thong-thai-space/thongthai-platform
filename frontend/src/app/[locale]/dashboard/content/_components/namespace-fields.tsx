'use client';

import { getIn, humanizeKey, type DraftValue } from './draft-utils';

type Props = {
  defaults: Record<string, unknown>;
  draft: Record<string, unknown>;
  onChange: (path: string[], value: DraftValue) => void;
  path?: string[];
};

// Recursively renders an editable form for one next-intl namespace, driven by the
// shape of its static defaults. Leaves: string (input/textarea) or string[]
// (one item per line). Nested objects become labeled groups.
export function NamespaceFields({ defaults, draft, onChange, path = [] }: Props) {
  return (
    <div className="space-y-4">
      {Object.entries(defaults).map(([key, defaultValue]) => {
        const fieldPath = [...path, key];
        const draftValue = getIn(draft, fieldPath);

        if (typeof defaultValue === 'string') {
          const value = typeof draftValue === 'string' ? draftValue : '';
          const long = defaultValue.length > 60;
          return (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {humanizeKey(key)}
              </label>
              {long ? (
                <textarea
                  rows={3}
                  value={value}
                  placeholder={defaultValue}
                  onChange={(e) => onChange(fieldPath, e.target.value)}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  placeholder={defaultValue}
                  onChange={(e) => onChange(fieldPath, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          );
        }

        if (
          Array.isArray(defaultValue) &&
          defaultValue.every((item) => typeof item === 'string')
        ) {
          const value = Array.isArray(draftValue)
            ? (draftValue as string[]).join('\n')
            : '';
          return (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {humanizeKey(key)}{' '}
                <span className="text-xs text-muted-foreground">(mỗi dòng một mục)</span>
              </label>
              <textarea
                rows={Math.max(3, defaultValue.length)}
                value={value}
                placeholder={(defaultValue as string[]).join('\n')}
                onChange={(e) => onChange(fieldPath, e.target.value.split('\n'))}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          );
        }

        if (defaultValue && typeof defaultValue === 'object') {
          return (
            <fieldset
              key={key}
              className="rounded-lg border border-border/70 p-4"
            >
              <legend className="px-1 text-sm font-semibold text-primary">
                {humanizeKey(key)}
              </legend>
              <NamespaceFields
                defaults={defaultValue as Record<string, unknown>}
                draft={draft}
                onChange={onChange}
                path={fieldPath}
              />
            </fieldset>
          );
        }

        return null;
      })}
    </div>
  );
}
