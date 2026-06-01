import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PlaybookStatus } from '@prisma/client';
import {
  ACADEMY_REPOSITORY,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../academy.constants';
import type { AcademyRepositoryPort } from '../domain/academy.repository.port';
import type { AdminPlaybookFilter } from '../domain/academy.types';
import { PlaybookPublishPolicy } from '../policies/playbook-publish.policy';
import { CreatePlaybookDto } from '../dto/create-playbook.dto';
import { UpdatePlaybookDto } from '../dto/update-playbook.dto';

/**
 * Pattern: Use Case bundle — playbook authoring (CRUD + publish lifecycle) is a
 * single cohesive concern with shared dependencies, so it lives in one class
 * rather than fragmenting into one-method classes (see blog.admin.use-cases).
 */
@Injectable()
export class PlaybookAdminUseCases {
  constructor(
    @Inject(ACADEMY_REPOSITORY)
    private readonly repo: AcademyRepositoryPort,
    private readonly publishPolicy: PlaybookPublishPolicy,
  ) {}

  listAll(filter: Partial<AdminPlaybookFilter>) {
    return this.repo.listPlaybooks({
      status: filter.status,
      page: Math.max(1, filter.page ?? 1),
      pageSize: Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, filter.pageSize ?? DEFAULT_PAGE_SIZE),
      ),
    });
  }

  async getById(id: string) {
    const playbook = await this.repo.findPlaybookById(id);
    if (!playbook) throw new NotFoundException('Playbook not found');
    return playbook;
  }

  async create(dto: CreatePlaybookDto, authorId: string) {
    this.publishPolicy.assertSlug(dto.slug);
    return this.repo.createPlaybook({
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      contentMdx: dto.contentMdx,
      tags: dto.tags ?? [],
      status: PlaybookStatus.DRAFT,
      author: { connect: { id: authorId } },
    });
  }

  async update(id: string, dto: UpdatePlaybookDto) {
    const existing = await this.getById(id);
    if (dto.slug && dto.slug !== existing.slug) {
      this.publishPolicy.assertSlug(dto.slug);
    }
    return this.repo.updatePlaybook(id, {
      title: dto.title ?? undefined,
      slug: dto.slug ?? undefined,
      summary: dto.summary ?? undefined,
      contentMdx: dto.contentMdx ?? undefined,
      tags: dto.tags ?? undefined,
    });
  }

  async publish(id: string) {
    const existing = await this.getById(id);
    this.publishPolicy.assertPublishable(existing);
    return this.repo.updatePlaybook(id, {
      status: PlaybookStatus.PUBLISHED,
      publishedAt: this.publishPolicy.resolvePublishedAt(existing),
    });
  }

  async unpublish(id: string) {
    await this.getById(id);
    return this.repo.updatePlaybook(id, { status: PlaybookStatus.DRAFT });
  }

  async archive(id: string) {
    await this.getById(id);
    return this.repo.updatePlaybook(id, { status: PlaybookStatus.ARCHIVED });
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repo.deletePlaybook(id);
  }
}
