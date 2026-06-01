// Pattern: Domain types — depend on nothing outside this module except the
// Prisma-generated enums/rows the repository returns.
import type {
  Playbook,
  PlaybookAssignmentStatus,
  PlaybookStatus,
} from '@prisma/client';

/** Action a client takes on an assigned playbook. */
export type ProgressAction = 'START' | 'COMPLETE';

export interface AdminPlaybookFilter {
  status?: PlaybookStatus;
  page: number;
  pageSize: number;
}

export interface PlaybookListResult {
  items: Playbook[];
  total: number;
  page: number;
  pageSize: number;
}

/** Light projection for a client's "my playbooks" list — no heavy contentMdx. */
export interface AssignmentWithPlaybookSummary {
  id: string;
  status: PlaybookAssignmentStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  playbook: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    tags: string[];
  };
}

/** Full projection for reading one assigned playbook (includes content). */
export interface AssignmentWithPlaybook {
  id: string;
  status: PlaybookAssignmentStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  playbook: Playbook;
}

/** Admin view of who a playbook is delivered to. */
export interface AssignmentWithClient {
  id: string;
  status: PlaybookAssignmentStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  client: { id: string; name: string; email: string };
}
