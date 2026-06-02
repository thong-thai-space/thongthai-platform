import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Playbook,
  PlaybookAssignment,
  PlaybookAssignmentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AcademyRepositoryPort } from '../domain/academy.repository.port';
import type {
  AdminPlaybookFilter,
  AssignmentWithClient,
  AssignmentWithPlaybook,
  AssignmentWithPlaybookSummary,
  PlaybookListResult,
} from '../domain/academy.types';

// Projection used for client-facing list views — keeps contentMdx off the wire.
const PLAYBOOK_SUMMARY_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  tags: true,
} as const;

// Pattern: Repository — Prisma adapter for the Academy module.
@Injectable()
export class AcademyRepository implements AcademyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  // ── Playbooks ──

  async listPlaybooks(
    filter: AdminPlaybookFilter,
  ): Promise<PlaybookListResult> {
    const where: Prisma.PlaybookWhereInput = {};
    if (filter.status) where.status = filter.status;

    const skip = (filter.page - 1) * filter.pageSize;
    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.playbook.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: filter.pageSize,
        }),
        this.prisma.playbook.count({ where }),
      ]);
      return { items, total, page: filter.page, pageSize: filter.pageSize };
    } catch {
      throw new InternalServerErrorException('Failed to list playbooks');
    }
  }

  async findPlaybookById(id: string): Promise<Playbook | null> {
    try {
      return await this.prisma.playbook.findUnique({ where: { id } });
    } catch {
      throw new InternalServerErrorException('Failed to fetch playbook');
    }
  }

  async createPlaybook(data: Prisma.PlaybookCreateInput): Promise<Playbook> {
    try {
      return await this.prisma.playbook.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A playbook with that slug already exists');
      }
      throw new InternalServerErrorException('Failed to create playbook');
    }
  }

  async updatePlaybook(
    id: string,
    data: Prisma.PlaybookUpdateInput,
  ): Promise<Playbook> {
    try {
      return await this.prisma.playbook.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Playbook not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A playbook with that slug already exists',
          );
        }
      }
      throw new InternalServerErrorException('Failed to update playbook');
    }
  }

  async deletePlaybook(id: string): Promise<void> {
    try {
      await this.prisma.playbook.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Playbook not found');
      }
      throw new InternalServerErrorException('Failed to delete playbook');
    }
  }

  // ── Assignments ──

  async assign(
    playbookId: string,
    clientId: string,
    assignedById: string,
  ): Promise<PlaybookAssignment> {
    try {
      return await this.prisma.playbookAssignment.create({
        data: { playbookId, clientId, assignedById },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'This playbook is already assigned to that client',
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Playbook or client not found');
        }
      }
      throw new InternalServerErrorException('Failed to assign playbook');
    }
  }

  async unassign(assignmentId: string): Promise<void> {
    try {
      await this.prisma.playbookAssignment.delete({
        where: { id: assignmentId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Assignment not found');
      }
      throw new InternalServerErrorException('Failed to remove assignment');
    }
  }

  async listAssignmentsForPlaybook(
    playbookId: string,
  ): Promise<AssignmentWithClient[]> {
    try {
      const rows = await this.prisma.playbookAssignment.findMany({
        where: { playbookId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          client: { select: { id: true, name: true, email: true } },
        },
      });
      return rows;
    } catch {
      throw new InternalServerErrorException('Failed to list assignments');
    }
  }

  // ── Client portal (tenant-scoped) ──

  async listAssignmentsForClient(
    clientId: string,
  ): Promise<AssignmentWithPlaybookSummary[]> {
    try {
      const rows = await this.prisma.playbookAssignment.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          playbook: { select: PLAYBOOK_SUMMARY_SELECT },
        },
      });
      return rows;
    } catch {
      throw new InternalServerErrorException('Failed to list your playbooks');
    }
  }

  async findAssignmentForClient(
    assignmentId: string,
    clientId: string,
  ): Promise<AssignmentWithPlaybook | null> {
    try {
      // The clientId filter is the tenant guard: an assignment owned by someone
      // else simply returns null, never another client's content.
      return await this.prisma.playbookAssignment.findFirst({
        where: { id: assignmentId, clientId },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          playbook: true,
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch playbook');
    }
  }

  async updateAssignmentProgress(
    assignmentId: string,
    data: {
      status: PlaybookAssignmentStatus;
      startedAt?: Date;
      completedAt?: Date;
    },
  ): Promise<PlaybookAssignment> {
    try {
      return await this.prisma.playbookAssignment.update({
        where: { id: assignmentId },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Assignment not found');
      }
      throw new InternalServerErrorException('Failed to update progress');
    }
  }
}
