import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Pattern: Repository Pattern
 * Generic base repository with common CRUD operations
 * Extends with specific data access logic per module
 */
@Injectable()
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected prisma: PrismaService) {}

  /**
   * Find all records with optional filtering
   */
  abstract findAll(filters?: Record<string, any>): Promise<T[]>;

  /**
   * Find single record by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Create new record
   */
  abstract create(data: CreateInput): Promise<T>;

  /**
   * Update existing record
   */
  abstract update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Delete record
   */
  abstract delete(id: string): Promise<boolean>;

  /**
   * Count total records
   */
  abstract count(filters?: Record<string, any>): Promise<number>;
}

/**
 * Helper: Safe Prisma error handling
 */
export function handlePrismaError(error: any, context: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorMap: Record<string, string> = {
      P2002: 'Unique constraint violation',
      P2003: 'Foreign key constraint violation',
      P2025: 'Record not found',
    };
    throw new Error(`${context}: ${errorMap[error.code] || error.message}`);
  }
  throw error;
}
