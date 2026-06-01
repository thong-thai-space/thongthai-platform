import type {
  Playbook,
  PlaybookAssignment,
  PlaybookAssignmentStatus,
  Prisma,
} from '@prisma/client';
import type {
  AdminPlaybookFilter,
  AssignmentWithClient,
  AssignmentWithPlaybook,
  AssignmentWithPlaybookSummary,
  PlaybookListResult,
} from './academy.types';

/**
 * Pattern: Repository Port.
 *
 * Authoring (Playbook CRUD) is staff-only. Delivery (PlaybookAssignment) is
 * tenant-scoped by `clientId` — a client must only ever read their own
 * assignments (plan §5.1 isolation).
 */
export interface AcademyRepositoryPort {
  // ── Playbooks (staff authoring) ──
  listPlaybooks(filter: AdminPlaybookFilter): Promise<PlaybookListResult>;
  findPlaybookById(id: string): Promise<Playbook | null>;
  createPlaybook(data: Prisma.PlaybookCreateInput): Promise<Playbook>;
  updatePlaybook(
    id: string,
    data: Prisma.PlaybookUpdateInput,
  ): Promise<Playbook>;
  deletePlaybook(id: string): Promise<void>;

  // ── Assignments (delivery) ──
  /** Deliver a playbook to a client. Conflict if already assigned. */
  assign(
    playbookId: string,
    clientId: string,
    assignedById: string,
  ): Promise<PlaybookAssignment>;
  unassign(assignmentId: string): Promise<void>;
  listAssignmentsForPlaybook(
    playbookId: string,
  ): Promise<AssignmentWithClient[]>;

  // ── Client portal (tenant-scoped) ──
  listAssignmentsForClient(
    clientId: string,
  ): Promise<AssignmentWithPlaybookSummary[]>;
  /** Returns null if the assignment doesn't exist OR isn't owned by this client. */
  findAssignmentForClient(
    assignmentId: string,
    clientId: string,
  ): Promise<AssignmentWithPlaybook | null>;
  updateAssignmentProgress(
    assignmentId: string,
    data: {
      status: PlaybookAssignmentStatus;
      startedAt?: Date;
      completedAt?: Date;
    },
  ): Promise<PlaybookAssignment>;
}
