import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { ClientRepository } from './repositories/client.repository';

@Injectable()
export class ClientService {
  constructor(private clientRepository: ClientRepository) {}

  async findAll() {
    return this.clientRepository.findAllClients();
  }

  async findOne(id: string) {
    const client = await this.clientRepository.findClientById(id);
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto) {
    const existing = await this.clientRepository.findClientByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.clientRepository.createClient({
      ...dto,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    return this.clientRepository.updateClient(id, dto);
  }

  async remove(id: string) {
    return this.clientRepository.deactivateClient(id);
  }
}
