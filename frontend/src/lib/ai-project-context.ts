import type { Project } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function buildProjectAiContext(project?: Project): string {
  if (!project) return '';

  const lines: string[] = [];
  lines.push(`Project name: ${project.name}`);
  lines.push(`Status: ${project.status}`);

  if (project.client?.name) {
    lines.push(`Client: ${project.client.name}`);
  }

  if (project.description) {
    lines.push(`Description: ${project.description}`);
  }

  if (project.budget) {
    lines.push(`Budget: ${formatCurrency(Number(project.budget), project.currency)}`);
  }

  if (project.deadline) {
    lines.push(`Deadline: ${formatDate(project.deadline)}`);
  }

  if (project.techStack.length > 0) {
    lines.push(`Tech stack: ${project.techStack.join(', ')}`);
  }

  return lines.join('\n');
}

export function buildProjectTechStack(project?: Project): string {
  if (!project || project.techStack.length === 0) return '';
  return project.techStack.join(', ');
}
