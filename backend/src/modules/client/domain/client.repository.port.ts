import type { Prisma } from '@prisma/client';

export interface ClientRepositoryPort {
  findAllClients(): Promise<unknown[]>;
  findClientById(id: string): Promise<unknown | null>;
  findClientByEmail(email: string): Promise<unknown | null>;
  createClient(data: Prisma.UserCreateInput): Promise<unknown>;
  updateClient(id: string, data: Prisma.UserUpdateInput): Promise<unknown>;
  deactivateClient(id: string): Promise<unknown>;
}
