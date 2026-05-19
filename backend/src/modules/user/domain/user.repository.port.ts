import type { Prisma, User } from '@prisma/client';

export interface UserRepositoryPort {
  findAll(where?: Prisma.UserWhereInput): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  delete(id: string): Promise<boolean>;
  count(where?: Prisma.UserWhereInput): Promise<number>;
}
