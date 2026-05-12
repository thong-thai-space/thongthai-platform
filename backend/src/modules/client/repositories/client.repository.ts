import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ClientRepository {
  constructor(private prisma: PrismaService) {}

  async findAllClients() {
    try {
      return await this.prisma.user.findMany({
        where: { role: UserRole.CLIENT },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          _count: { select: { clientProjects: true, clientInvoices: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch clients');
    }
  }

  async findClientById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id, role: UserRole.CLIENT },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          clientProjects: {
            select: { id: true, name: true, status: true },
          },
          clientInvoices: {
            select: { id: true, invoiceNumber: true, status: true, total: true },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch client');
    }
  }

  async findClientByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch client');
    }
  }

  async createClient(data: Prisma.UserCreateInput) {
    try {
      return await this.prisma.user.create({
        data,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to create client');
    }
  }

  async updateClient(id: string, data: Prisma.UserUpdateInput) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Client not found');
      }
      throw new InternalServerErrorException('Failed to update client');
    }
  }

  async deactivateClient(id: string) {
    try {
      return await this.prisma.user.update({
        where: { id, role: UserRole.CLIENT },
        data: { isActive: false },
        select: { id: true, email: true, isActive: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Client not found');
      }
      throw new InternalServerErrorException('Failed to remove client');
    }
  }
}
