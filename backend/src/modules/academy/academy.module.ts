import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcademyController } from './academy.controller';
import { AcademyService } from './academy.service';
import { AcademyRepository } from './repositories/academy.repository';
import { PlaybookPublishPolicy } from './policies/playbook-publish.policy';
import { PlaybookProgressPolicy } from './policies/playbook-progress.policy';
import { PlaybookAdminUseCases } from './use-cases/playbook-admin.use-cases';
import { AssignPlaybookUseCase } from './use-cases/assign-playbook.use-case';
import { ClientPlaybooksUseCase } from './use-cases/client-playbooks.use-case';
import { ACADEMY_REPOSITORY } from './academy.constants';

// Pattern: Composition Root — binds the port to its Prisma adapter.
@Module({
  imports: [AuthModule],
  controllers: [AcademyController],
  providers: [
    AcademyService,
    AcademyRepository,
    PlaybookPublishPolicy,
    PlaybookProgressPolicy,
    PlaybookAdminUseCases,
    AssignPlaybookUseCase,
    ClientPlaybooksUseCase,
    { provide: ACADEMY_REPOSITORY, useExisting: AcademyRepository },
  ],
  exports: [AcademyService],
})
export class AcademyModule {}
