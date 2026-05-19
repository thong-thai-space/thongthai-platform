import type { Prisma, ProjectFile } from '@prisma/client';

export interface ProjectFileWithProject extends ProjectFile {
  project: { id: string; clientId: string | null };
}

export interface FileRepositoryPort {
  findByProject(projectId: string): Promise<ProjectFile[]>;
  findFileWithProject(id: string): Promise<ProjectFileWithProject | null>;
  findFileProjectId(id: string): Promise<{ projectId: string } | null>;
  createFile(data: Prisma.ProjectFileCreateInput): Promise<ProjectFile>;
  deleteFile(id: string): Promise<ProjectFile>;
  findProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<{
    ownerId: string;
    clientId: string | null;
    tasks: { id: string }[];
  } | null>;
}
