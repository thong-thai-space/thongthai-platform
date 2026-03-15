import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
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
  }

  async findOne(id: string) {
    const client = await this.prisma.user.findUnique({
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
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        role: UserRole.CLIENT,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id, role: UserRole.CLIENT },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }
}
