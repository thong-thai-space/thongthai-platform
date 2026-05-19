import { Injectable } from '@nestjs/common';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { ClientUseCases } from './use-cases/client.use-cases';

// Pattern: Facade — controllers depend on this; use cases own behavior
@Injectable()
export class ClientService {
  constructor(private readonly useCases: ClientUseCases) {}

  findAll() {
    return this.useCases.findAll();
  }

  findOne(id: string) {
    return this.useCases.findOne(id);
  }

  create(dto: CreateClientDto) {
    return this.useCases.create(dto);
  }

  update(id: string, dto: UpdateClientDto) {
    return this.useCases.update(id, dto);
  }

  remove(id: string) {
    return this.useCases.remove(id);
  }
}
