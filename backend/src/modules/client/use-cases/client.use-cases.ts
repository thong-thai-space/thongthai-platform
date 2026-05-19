import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateClientDto, UpdateClientDto } from '../dto/client.dto';
import {
  CLIENT_PASSWORD_HASHER,
  CLIENT_PASSWORD_RULES,
  CLIENT_REPOSITORY,
} from '../client.constants';
import type { ClientRepositoryPort } from '../domain/client.repository.port';
import type { ClientPasswordHasherPort } from '../domain/client.password-hasher.port';

// Pattern: Use Case — client/customer management business rules
@Injectable()
export class ClientUseCases {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly repo: ClientRepositoryPort,
    @Inject(CLIENT_PASSWORD_HASHER)
    private readonly hasher: ClientPasswordHasherPort,
  ) {}

  findAll() {
    return this.repo.findAllClients();
  }

  async findOne(id: string) {
    const client = await this.repo.findClientById(id);
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto) {
    if (!CLIENT_PASSWORD_RULES.regex.test(dto.password)) {
      throw new BadRequestException(CLIENT_PASSWORD_RULES.message);
    }

    const existing = await this.repo.findClientByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await this.hasher.hash(dto.password);
    return this.repo.createClient({
      ...dto,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });
  }

  update(id: string, dto: UpdateClientDto) {
    return this.repo.updateClient(id, dto);
  }

  remove(id: string) {
    return this.repo.deactivateClient(id);
  }
}
