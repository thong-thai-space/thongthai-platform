import { Injectable } from '@nestjs/common';
import { ContentUseCases } from './use-cases/content.use-cases';

// Pattern: Facade — keeps the controller surface stable while use cases own behavior
@Injectable()
export class ContentService {
  constructor(private readonly useCases: ContentUseCases) {}

  findAll() {
    return this.useCases.findAll();
  }

  findBySection(section: string) {
    return this.useCases.findBySection(section);
  }

  upsert(section: string, data: unknown, isActive = true) {
    return this.useCases.upsert(section, data, isActive);
  }

  remove(section: string) {
    return this.useCases.remove(section);
  }

  seed() {
    return this.useCases.seed();
  }
}
