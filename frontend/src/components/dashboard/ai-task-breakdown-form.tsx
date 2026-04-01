'use client';

import { useMemo, useState } from 'react';
import { GitBranch, Loader2, Upload } from 'lucide-react';
import type { TaskBreakdownResponse } from '@/hooks/use-ai';
import { useProjects } from '@/hooks/use-projects';
import { buildProjectAiContext, buildProjectTechStack } from '@/lib/ai-project-context';
import { importTextFile } from '@/lib/file-export';

interface AiTaskBreakdownFormProps {
  onGenerate: (description: string, techStack: string[]) => void;
  isPending: boolean;
  initialProjectId?: string;
}

/**
 * Pattern: Component Composition
 * Extracted form section from main component for better readability
 */
export function AiTaskBreakdownForm({
  onGenerate,
  isPending,
  initialProjectId,
}: AiTaskBreakdownFormProps) {
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const { data: projects = [] } = useProjects();

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projectId, projects],
  );

  const handleGenerate = () => {
    if (!description.trim() || isPending) return;
    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onGenerate(description.trim(), techStack);
  };

  const handleImport = async () => {
    try {
      const text = await importTextFile();
      setDescription(text);
    } catch {
      // user cancelled file picker
    }
  };

  const handleUseProjectContext = () => {
    const context = buildProjectAiContext(selectedProject);
    if (context) {
      setDescription(context);
    }

    const nextStack = buildProjectTechStack(selectedProject);
    if (nextStack) {
      setTechStackInput(nextStack);
    }
  };

  const handleProjectChange = (nextProjectId: string) => {
    setProjectId(nextProjectId);

    const project = projects.find((item) => item.id === nextProjectId);
    if (!project) return;

    if (!description.trim()) {
      const context = buildProjectAiContext(project);
      if (context) {
        setDescription(context);
      }
    }

    if (!techStackInput.trim()) {
      const nextStack = buildProjectTechStack(project);
      if (nextStack) {
        setTechStackInput(nextStack);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Project</label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="min-w-60 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select project (optional)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleUseProjectContext}
            disabled={!projectId}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            Use project context
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Project description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the project to break down: features, technical requirements..."
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Tech Stack</label>
        <input
          type="text"
          value={techStackInput}
          onChange={(e) => setTechStackInput(e.target.value)}
          placeholder="React, NestJS, PostgreSQL (comma separated)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <button
        onClick={handleGenerate}
        disabled={!description.trim() || isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <GitBranch className="h-4 w-4" />
            Task Breakdown
          </>
        )}
      </button>
      <button
        onClick={handleImport}
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        <Upload className="h-4 w-4" />
        Import File
      </button>
    </div>
  );
}
