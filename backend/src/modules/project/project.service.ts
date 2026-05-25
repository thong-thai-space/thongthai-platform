import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { UpdateProjectClientDto } from './dto/update-project-client.dto';
import { ProjectUseCases } from './use-cases/project.use-cases';

// Pattern: Facade — keeps the controller-facing surface stable
@Injectable()
export class ProjectService {
  constructor(private readonly useCases: ProjectUseCases) {}

  findAll(userId: string, role: UserRole) {
    return this.useCases.findAll(userId, role);
  }

  findOne(id: string, userId: string, role: UserRole) {
    return this.useCases.findOne(id, userId, role);
  }

  create(dto: CreateProjectDto, userId: string) {
    return this.useCases.create(dto, userId);
  }

  createRequest(dto: CreateProjectRequestDto, clientId: string) {
    return this.useCases.createRequest(dto, clientId);
  }

  update(id: string, dto: UpdateProjectDto, userId: string) {
    return this.useCases.update(id, dto, userId);
  }

  remove(id: string, userId: string) {
    return this.useCases.remove(id, userId);
  }

  acceptRequest(projectId: string, adminUserId: string) {
    return this.useCases.acceptRequest(projectId, adminUserId);
  }

  updateByClient(
    projectId: string,
    clientId: string,
    dto: UpdateProjectClientDto,
  ) {
    return this.useCases.updateByClient(projectId, clientId, dto);
  }

  getShowcase() {
    return this.useCases.getShowcase();
  }
}
