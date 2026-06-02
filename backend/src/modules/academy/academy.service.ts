import { Injectable } from '@nestjs/common';
import type { ProgressAction } from './domain/academy.types';
import type { AdminPlaybookFilter } from './domain/academy.types';
import { PlaybookAdminUseCases } from './use-cases/playbook-admin.use-cases';
import { AssignPlaybookUseCase } from './use-cases/assign-playbook.use-case';
import { ClientPlaybooksUseCase } from './use-cases/client-playbooks.use-case';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';

/**
 * Pattern: Facade — the controller-facing API for Academy. Delegates to the
 * authoring, delivery, and client-portal use cases; holds no logic itself.
 */
@Injectable()
export class AcademyService {
  constructor(
    private readonly admin: PlaybookAdminUseCases,
    private readonly assignment: AssignPlaybookUseCase,
    private readonly client: ClientPlaybooksUseCase,
  ) {}

  // ── Admin: authoring ──
  listPlaybooks(filter: Partial<AdminPlaybookFilter>) {
    return this.admin.listAll(filter);
  }
  getPlaybook(id: string) {
    return this.admin.getById(id);
  }
  createPlaybook(dto: CreatePlaybookDto, authorId: string) {
    return this.admin.create(dto, authorId);
  }
  updatePlaybook(id: string, dto: UpdatePlaybookDto) {
    return this.admin.update(id, dto);
  }
  publishPlaybook(id: string) {
    return this.admin.publish(id);
  }
  unpublishPlaybook(id: string) {
    return this.admin.unpublish(id);
  }
  archivePlaybook(id: string) {
    return this.admin.archive(id);
  }
  deletePlaybook(id: string) {
    return this.admin.delete(id);
  }

  // ── Admin: delivery ──
  assignPlaybook(playbookId: string, clientId: string, assignedById: string) {
    return this.assignment.assign(playbookId, clientId, assignedById);
  }
  unassignPlaybook(assignmentId: string) {
    return this.assignment.unassign(assignmentId);
  }
  listPlaybookAssignees(playbookId: string) {
    return this.assignment.listAssignees(playbookId);
  }

  // ── Client portal ──
  listMyPlaybooks(clientId: string) {
    return this.client.listMine(clientId);
  }
  getMyPlaybook(assignmentId: string, clientId: string) {
    return this.client.getMine(assignmentId, clientId);
  }
  updateMyProgress(
    assignmentId: string,
    clientId: string,
    action: ProgressAction,
  ) {
    return this.client.updateProgress(assignmentId, clientId, action);
  }
}
