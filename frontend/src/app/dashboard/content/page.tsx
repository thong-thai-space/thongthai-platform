/* eslint-disable @next/next/no-img-element */
'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import {
  useAllContent,
  useUpdateContent,
  useSeedContent,
  useDeleteContent,
  useUploadContentImage,
} from '@/hooks/use-content';
import {
  useProjects,
  useUpdatePortfolioProject,
  useUploadPortfolioThumbnail,
} from '@/hooks/use-projects';
import { useMemo, useState } from 'react';
import { Save, RefreshCw, Check, Trash2, Plus, Upload } from 'lucide-react';
import type { Project } from '@/types';

const SECTIONS = [
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'process', label: 'Process' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'footer', label: 'Footer' },
];

type FeaturedProjectItem = {
  title: string;
  client: string;
  description: string;
  techStack: string[];
};

type PortfolioSectionData = {
  title: string;
  subtitle: string;
  viewAllText: string;
  items: FeaturedProjectItem[];
};

const PORTFOLIO_DEFAULTS: PortfolioSectionData = {
  title: 'Featured Projects',
  subtitle: 'A selection of projects we have successfully delivered for our clients',
  viewAllText: 'View all projects',
  items: [],
};

const ABOUT_DEFAULTS = {
  hero: {
    title: 'About Thong Thai Space',
    subtitle:
      'We are a team of technology experts specializing in Web, App, AI development and IT consulting for small and medium businesses.',
  },
  valuesTitle: 'Core Values',
  values: [
    { icon: 'Target', title: 'Quality', description: 'Committed to high-quality products, clean code, great performance, and security.' },
    { icon: 'Users', title: 'Partnership', description: "Not just a vendor, but a long-term partner committed to our clients' success." },
    { icon: 'Heart', title: 'Dedication', description: "We listen, understand, and put our clients' interests first in every project." },
    { icon: 'Award', title: 'Innovation', description: 'Constantly adopting new technologies and applying creative solutions to every challenge.' },
  ],
  teamTitle: 'Our Team',
  teamSubtitle: 'The people behind every successful project',
  team: [
    { name: 'Nguyen Hoang Thai', role: 'Founder & CEO', bio: 'Full-stack developer passionate about AI and automation.', avatar: '' },
  ],
};

const SECTION_DEFAULTS: Record<string, unknown> = {
  about: ABOUT_DEFAULTS,
};

type AboutSectionData = {
  hero: { title: string; subtitle: string };
  valuesTitle: string;
  values: Array<{ icon: string; title: string; description: string }>;
  teamTitle: string;
  teamSubtitle: string;
  team: Array<{ name: string; role: string; bio: string; avatar?: string }>;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type EditorMode = 'visual' | 'json';

function toDisplayLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (m) => m.toUpperCase());
}

function isObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildDefaultFromTemplate(template: unknown): unknown {
  if (Array.isArray(template)) return [];
  if (isObjectValue(template)) {
    const next: Record<string, unknown> = {};
    Object.entries(template).forEach(([k, v]) => {
      next[k] = buildDefaultFromTemplate(v);
    });
    return next;
  }
  if (typeof template === 'number') return 0;
  if (typeof template === 'boolean') return false;
  if (template === null) return null;
  return '';
}

function PrimitiveEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: JsonPrimitive;
  onChange: (next: JsonPrimitive) => void;
}) {
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <span className="text-sm font-medium">{label}</span>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </label>
    );
  }

  if (typeof value === 'number') {
    return (
      <label className="space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
    );
  }

  if (value === null) {
    return (
      <label className="space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <input
          type="text"
          value=""
          onChange={(e) => onChange(e.target.value)}
          placeholder="null"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
    );
  }

  const stringValue = String(value ?? '');
  const shouldUseTextarea = stringValue.length > 90 || stringValue.includes('\n');

  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {shouldUseTextarea ? (
        <textarea
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </label>
  );
}

function VisualEditorNode({
  label,
  value,
  onChange,
  depth = 0,
}: {
  label: string;
  value: unknown;
  onChange: (next: unknown) => void;
  depth?: number;
}) {
  if (Array.isArray(value)) {
    const sample = value[0];
    const canAdd = value.length > 0 || sample !== undefined;

    return (
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{label}</p>
          <button
            type="button"
            onClick={() => {
              const template = sample !== undefined ? sample : '';
              onChange([...value, buildDefaultFromTemplate(template)]);
            }}
            className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
            disabled={!canAdd && value.length === 0}
          >
            Add item
          </button>
        </div>

        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="space-y-3">
            {value.map((item, index) => (
              <div key={index} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label} #{index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                </div>
                <VisualEditorNode
                  label={toDisplayLabel(String(index + 1))}
                  value={item}
                  onChange={(nextItem) => {
                    const next = value.map((existing, i) => (i === index ? nextItem : existing));
                    onChange(next);
                  }}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isObjectValue(value)) {
    const entries = Object.entries(value);
    return (
      <div className="space-y-3 rounded-lg border border-border p-3">
        {depth <= 1 && <p className="text-sm font-semibold">{label}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {entries.map(([key, child]) => (
            <div key={key} className={isObjectValue(child) || Array.isArray(child) ? 'md:col-span-2' : ''}>
              <VisualEditorNode
                label={toDisplayLabel(key)}
                value={child}
                onChange={(nextChild) => onChange({ ...value, [key]: nextChild })}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const primitive =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null
      ? value
      : '';

  return (
    <PrimitiveEditor
      label={label}
      value={primitive}
      onChange={(next) => onChange(next)}
    />
  );
}

function JsonEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState('');

  const handleChange = (newText: string) => {
    setText(newText);
    try {
      const parsed = JSON.parse(newText);
      setError('');
      onChange(parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background p-4 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        rows={20}
        spellCheck={false}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function toAboutSectionData(value: unknown): AboutSectionData {
  const base = ABOUT_DEFAULTS as AboutSectionData;
  if (!isObjectValue(value)) return base;

  const hero = isObjectValue(value.hero)
    ? {
        title: typeof value.hero.title === 'string' ? value.hero.title : base.hero.title,
        subtitle:
          typeof value.hero.subtitle === 'string'
            ? value.hero.subtitle
            : base.hero.subtitle,
      }
    : base.hero;

  const values = Array.isArray(value.values)
    ? value.values
        .map((item) => {
          if (!isObjectValue(item)) return null;
          return {
            icon: typeof item.icon === 'string' ? item.icon : 'Target',
            title: typeof item.title === 'string' ? item.title : '',
            description: typeof item.description === 'string' ? item.description : '',
          };
        })
        .filter((item): item is AboutSectionData['values'][number] => item !== null)
    : base.values;

  const team: AboutSectionData['team'] = Array.isArray(value.team)
    ? value.team.reduce<AboutSectionData['team']>((acc, item) => {
        if (!isObjectValue(item)) return acc;
        acc.push({
          name: typeof item.name === 'string' ? item.name : '',
          role: typeof item.role === 'string' ? item.role : '',
          bio: typeof item.bio === 'string' ? item.bio : '',
          avatar: typeof item.avatar === 'string' ? item.avatar : '',
        });
        return acc;
      }, [])
    : base.team;

  return {
    hero,
    valuesTitle: typeof value.valuesTitle === 'string' ? value.valuesTitle : base.valuesTitle,
    values,
    teamTitle: typeof value.teamTitle === 'string' ? value.teamTitle : base.teamTitle,
    teamSubtitle:
      typeof value.teamSubtitle === 'string'
        ? value.teamSubtitle
        : base.teamSubtitle,
    team,
  };
}

function AboutVisualEditor({
  value,
  onChange,
  onUploadAvatar,
  uploadingKey,
}: {
  value: unknown;
  onChange: (v: AboutSectionData) => void;
  onUploadAvatar: (file: File, key: string) => Promise<string | undefined>;
  uploadingKey: string;
}) {
  const data = toAboutSectionData(value);

  const updateHero = (key: 'title' | 'subtitle', next: string) => {
    onChange({
      ...data,
      hero: { ...data.hero, [key]: next },
    });
  };

  const updateValue = (index: number, patch: Partial<AboutSectionData['values'][number]>) => {
    onChange({
      ...data,
      values: data.values.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  };

  const updateTeam = (index: number, patch: Partial<AboutSectionData['team'][number]>) => {
    onChange({
      ...data,
      team: data.team.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  };

  const addTeam = () => {
    onChange({
      ...data,
      team: [...data.team, { name: '', role: '', bio: '', avatar: '' }],
    });
  };

  const removeTeam = (index: number) => {
    onChange({
      ...data,
      team: data.team.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hero Title</span>
          <input
            value={data.hero.title}
            onChange={(e) => updateHero('title', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hero Subtitle</span>
          <textarea
            value={data.hero.subtitle}
            onChange={(e) => updateHero('subtitle', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Values Title</span>
          <input
            value={data.valuesTitle}
            onChange={(e) => onChange({ ...data, valuesTitle: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team Title</span>
          <input
            value={data.teamTitle}
            onChange={(e) => onChange({ ...data, teamTitle: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team Subtitle</span>
          <input
            value={data.teamSubtitle}
            onChange={(e) => onChange({ ...data, teamSubtitle: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold">Values</h3>
        <div className="space-y-3">
          {data.values.map((item, index) => (
            <div key={`value-${index}`} className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 md:grid-cols-3">
              <input
                value={item.icon}
                onChange={(e) => updateValue(index, { icon: e.target.value })}
                placeholder="Icon (Target/Users/Heart/Award)"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={item.title}
                onChange={(e) => updateValue(index, { title: e.target.value })}
                placeholder="Title"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={item.description}
                onChange={(e) => updateValue(index, { description: e.target.value })}
                placeholder="Description"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Team</h3>
          <button
            type="button"
            onClick={addTeam}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
        <div className="space-y-3">
          {data.team.map((member, index) => {
            const key = `team-${index}`;
            return (
              <div key={key} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team #{index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeTeam(index)}
                    className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={member.name}
                    onChange={(e) => updateTeam(index, { name: e.target.value })}
                    placeholder="Name"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    value={member.role}
                    onChange={(e) => updateTeam(index, { role: e.target.value })}
                    placeholder="Role"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <textarea
                    value={member.bio}
                    onChange={(e) => updateTeam(index, { bio: e.target.value })}
                    rows={2}
                    placeholder="Bio"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                        <Upload className="h-4 w-4" />
                        {uploadingKey === key ? 'Uploading...' : 'Upload avatar'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await onUploadAvatar(file, key);
                            if (url) updateTeam(index, { avatar: url });
                          }}
                        />
                      </label>
                      <input
                        value={member.avatar ?? ''}
                        onChange={(e) => updateTeam(index, { avatar: e.target.value })}
                        placeholder="Avatar URL"
                        className="min-w-72 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PortfolioFeaturedProjectsEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: PortfolioSectionData) => void;
}) {
  const data = toPortfolioSectionData(value);

  const updateRoot = (key: keyof PortfolioSectionData, next: string) => {
    onChange({
      ...data,
      [key]: next,
    });
  };

  const updateItem = (index: number, patch: Partial<FeaturedProjectItem>) => {
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
        {
          title: '',
          client: '',
          description: '',
          techStack: [],
        },
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
            onChange={(e) => updateRoot('title', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subtitle</span>
          <textarea
            value={data.subtitle}
            onChange={(e) => updateRoot('subtitle', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">View All Button Text</span>
          <input
            value={data.viewAllText}
            onChange={(e) => updateRoot('viewAllText', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Featured Projects ({data.items.length})</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add Project
          </button>
        </div>

        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No featured projects yet. Click &quot;Add Project&quot;.</p>
        ) : (
          <div className="space-y-3">
            {data.items.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Project #{index + 1}
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
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</span>
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(index, { title: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client</span>
                    <input
                      value={item.client}
                      onChange={(e) => updateItem(index, { client: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</span>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tech Stack (comma separated)</span>
                    <input
                      value={item.techStack.join(', ')}
                      onChange={(e) =>
                        updateItem(index, {
                          techStack: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioDatabaseManager({ contentValue }: { contentValue: unknown }) {
  const { data: projects = [], isLoading } = useProjects();
  const updatePortfolioProject = useUpdatePortfolioProject();
  const uploadThumbnail = useUploadPortfolioThumbnail();
  const [savingId, setSavingId] = useState<string>('');
  const [uploadingId, setUploadingId] = useState<string>('');

  const showcaseProjects = useMemo(
    () => [...projects].sort((a, b) => Number(a.showcaseOrder || 9999) - Number(b.showcaseOrder || 9999)),
    [projects],
  );

  const categories = extractPortfolioCategories(contentValue);

  const handlePatch = async (id: string, patch: Partial<Project>) => {
    setSavingId(id);
    try {
      await updatePortfolioProject.mutateAsync({ id, ...patch });
    } finally {
      setSavingId('');
    }
  };

  const handleThumbnailUpload = async (projectId: string, file?: File) => {
    if (!file) return;
    setUploadingId(projectId);
    try {
      await uploadThumbnail.mutateAsync({ id: projectId, file });
    } finally {
      setUploadingId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        Featured Projects on landing and Portfolio cards are now loaded from real project records in the database.
        Toggle showcase, set order, upload thumbnail, and update portfolio metadata below. Project name, client, description,
        and tech stack are read from the database automatically.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {showcaseProjects.map((project) => (
            <div key={project.id} className="rounded-xl border border-border bg-background p-4">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{project.name}</h3>
                    {project.isShowcase && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{project.client?.name || 'No client linked'}</p>
                  {project.description && (
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{project.description}</p>
                  )}
                  {project.techStack?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={project.isShowcase}
                    onChange={(e) => handlePatch(project.id, { isShowcase: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Show on Portfolio
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display Order</span>
                  <input
                    type="number"
                    value={project.showcaseOrder ?? ''}
                    onChange={(e) => handlePatch(project.id, { showcaseOrder: Number(e.target.value || 0) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</span>
                  <input
                    list={`portfolio-categories-${project.id}`}
                    value={project.showcaseCategory ?? ''}
                    onChange={(e) => handlePatch(project.id, { showcaseCategory: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <datalist id={`portfolio-categories-${project.id}`}>
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </label>

                <label className="space-y-1.5 xl:col-span-1 md:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live URL</span>
                  <input
                    value={project.liveUrl ?? ''}
                    onChange={(e) => handlePatch(project.id, { liveUrl: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2 xl:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Repository URL</span>
                  <input
                    value={project.repoUrl ?? ''}
                    onChange={(e) => handlePatch(project.id, { repoUrl: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2 xl:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Figma URL</span>
                  <input
                    value={project.figmaUrl ?? ''}
                    onChange={(e) => handlePatch(project.id, { figmaUrl: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2 xl:col-span-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Results Highlight</span>
                  <textarea
                    value={project.showcaseResults ?? ''}
                    onChange={(e) => handlePatch(project.id, { showcaseResults: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>

                <div className="space-y-1.5 md:col-span-2 xl:col-span-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thumbnail</span>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    {project.thumbnailUrl ? (
                      <img
                        src={resolveAssetUrl(project.thumbnailUrl)}
                        alt={project.name}
                        className="h-24 w-40 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        No thumbnail
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                        <Plus className="h-4 w-4" />
                        {uploadingId === project.id ? 'Uploading...' : 'Upload image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => handleThumbnailUpload(project.id, e.target.files?.[0])}
                        />
                      </label>
                      <input
                        value={project.thumbnailUrl ?? ''}
                        onChange={(e) => handlePatch(project.id, { thumbnailUrl: e.target.value })}
                        placeholder="Or paste image URL"
                        className="min-w-72 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {savingId === project.id ? 'Saving portfolio metadata...' : 'Changes are saved to the project record in database.'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function toPortfolioSectionData(value: unknown): PortfolioSectionData {
  if (!isObjectValue(value)) return PORTFOLIO_DEFAULTS;

  const title = typeof value.title === 'string' ? value.title : PORTFOLIO_DEFAULTS.title;
  const subtitle = typeof value.subtitle === 'string' ? value.subtitle : PORTFOLIO_DEFAULTS.subtitle;
  const viewAllText = typeof value.viewAllText === 'string' ? value.viewAllText : PORTFOLIO_DEFAULTS.viewAllText;
  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => {
          if (!isObjectValue(item)) return null;
          return {
            title: typeof item.title === 'string' ? item.title : '',
            client: typeof item.client === 'string' ? item.client : '',
            description: typeof item.description === 'string' ? item.description : '',
            techStack: Array.isArray(item.techStack)
              ? item.techStack.map((t) => String(t)).filter(Boolean)
              : [],
          };
        })
        .filter((item): item is FeaturedProjectItem => item !== null)
    : [];

  return {
    title,
    subtitle,
    viewAllText,
    items,
  };
}

function extractPortfolioCategories(value: unknown) {
  if (!isObjectValue(value) || !Array.isArray(value.categories)) return [] as string[];
  return value.categories.map((item) => String(item)).filter(Boolean);
}

function resolveAssetUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
  return `${apiBase}${path}`;
}

export default function ContentPage() {
  const { data: allContent = [], isLoading } = useAllContent();
  const updateContent = useUpdateContent();
  const uploadContentImage = useUploadContentImage();
  const seedContent = useSeedContent();
  const deleteContent = useDeleteContent();
  const [activeTab, setActiveTab] = useState('hero');
  const [draftData, setDraftData] = useState<Record<string, unknown>>({});
  const [editorModeBySection, setEditorModeBySection] = useState<Record<string, EditorMode>>({});
  const [saved, setSaved] = useState('');
  const [uploadingAboutKey, setUploadingAboutKey] = useState('');

  const contentMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    allContent.forEach((c) => {
      map[c.section] = c.data;
    });
    return map;
  }, [allContent]);

  const currentValue =
    activeTab in draftData ? draftData[activeTab] : contentMap[activeTab];

  const activeMode = editorModeBySection[activeTab] ?? 'visual';

  const handleSave = async (section: string) => {
    const value = section in draftData ? draftData[section] : contentMap[section];
    if (!value) return;

    await updateContent.mutateAsync({ section, data: value });
    setSaved(section);
    setTimeout(() => setSaved(''), 2000);
  };

  const handleSeed = async () => {
    await seedContent.mutateAsync();
  };

  const handleDelete = async (section: string) => {
    if (!window.confirm(`Delete content section "${section}"?`)) return;

    await deleteContent.mutateAsync(section);
    setDraftData((prev) => {
      const next = { ...prev };
      delete next[section];
      return next;
    });
  };

  const handleUploadAboutAvatar = async (file: File, key: string) => {
    setUploadingAboutKey(key);
    try {
      const result = await uploadContentImage.mutateAsync(file);
      return result.url;
    } finally {
      setUploadingAboutKey('');
    }
  };

  return (
    <>
      <DashboardHeader title="Content Management" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage all homepage content sections. Changes are reflected on the landing page immediately.
          </p>
          <button
            onClick={handleSeed}
            disabled={seedContent.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${seedContent.isPending ? 'animate-spin' : ''}`} />
            {seedContent.isPending ? 'Seeding...' : 'Seed Defaults'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === s.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditorModeBySection((prev) => ({ ...prev, [activeTab]: 'visual' }))
                }
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeMode === 'visual'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Visual Editor
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditorModeBySection((prev) => ({ ...prev, [activeTab]: 'json' }))
                }
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeMode === 'json'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                JSON
              </button>
            </div>

            {activeTab === 'portfolio' && activeMode === 'visual' ? (
              <PortfolioDatabaseManager contentValue={currentValue} />
            ) : !currentValue ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-muted-foreground">
                <p className="mb-1 text-sm font-medium">No content for &quot;{activeTab}&quot; section yet.</p>
                <p className="mb-4 text-sm">Click &quot;Seed Defaults&quot; to populate default content, or edit below and save.</p>
                <div>
                  {activeMode === 'visual' ? (
                    activeTab === 'about' ? (
                      <AboutVisualEditor
                        value={draftData[activeTab] ?? SECTION_DEFAULTS[activeTab] ?? {}}
                        onChange={(v) =>
                          setDraftData((prev) => ({
                            ...prev,
                            [activeTab]: v,
                          }))
                        }
                        uploadingKey={uploadingAboutKey}
                        onUploadAvatar={handleUploadAboutAvatar}
                      />
                    ) : (
                      <VisualEditorNode
                        label={toDisplayLabel(activeTab)}
                        value={draftData[activeTab] ?? SECTION_DEFAULTS[activeTab] ?? {}}
                        onChange={(v) =>
                          setDraftData((prev) => ({
                            ...prev,
                            [activeTab]: v,
                          }))
                        }
                      />
                    )
                  ) : (
                    <JsonEditor
                      key={`${activeTab}-${activeMode}`}
                      value={{}}
                      onChange={(v) =>
                        setDraftData((prev) => ({
                          ...prev,
                          [activeTab]: v,
                        }))
                      }
                    />
                  )}
                  <button
                    onClick={() => handleSave(activeTab)}
                    disabled={updateContent.isPending}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {activeMode === 'visual' && activeTab === 'portfolio' ? (
                  <PortfolioFeaturedProjectsEditor
                    value={currentValue}
                    onChange={(v) =>
                      setDraftData((prev) => ({
                        ...prev,
                        [activeTab]: v,
                      }))
                    }
                  />
                ) : activeMode === 'visual' && activeTab === 'about' ? (
                  <AboutVisualEditor
                    value={currentValue}
                    onChange={(v) =>
                      setDraftData((prev) => ({
                        ...prev,
                        [activeTab]: v,
                      }))
                    }
                    uploadingKey={uploadingAboutKey}
                    onUploadAvatar={handleUploadAboutAvatar}
                  />
                ) : activeMode === 'visual' ? (
                  <VisualEditorNode
                    label={toDisplayLabel(activeTab)}
                    value={currentValue}
                    onChange={(v) =>
                      setDraftData((prev) => ({
                        ...prev,
                        [activeTab]: v,
                      }))
                    }
                  />
                ) : (
                  <JsonEditor
                    key={`${activeTab}-${activeMode}`}
                    value={currentValue}
                    onChange={(v) =>
                      setDraftData((prev) => ({
                        ...prev,
                        [activeTab]: v,
                      }))
                    }
                  />
                )}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleSave(activeTab)}
                    disabled={updateContent.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updateContent.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {updateContent.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => handleDelete(activeTab)}
                    disabled={deleteContent.isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 disabled:opacity-50"
                  >
                    {deleteContent.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deleteContent.isPending ? 'Deleting...' : 'Delete Section'}
                  </button>
                  {saved === activeTab && (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-4 w-4" /> Saved
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
