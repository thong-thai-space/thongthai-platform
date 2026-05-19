import type { Prisma, User } from '@prisma/client';
import type { AuthUser } from './auth.types';

// Pattern: Repository Port — abstracts persistence from domain
export interface AuthRepositoryPort {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  findByVerificationToken(token: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
}
