import { Injectable } from '@nestjs/common';
import { ContactRequestStatus } from '@prisma/client';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactUseCases } from './use-cases/contact.use-cases';
import {
  ListLeadsInput,
  ListLeadsUseCase,
} from './use-cases/list-leads.use-case';
import { UpdateLeadStatusUseCase } from './use-cases/update-lead-status.use-case';

// Pattern: Facade — thin controller-facing API delegating to focused use cases.
@Injectable()
export class ContactService {
  constructor(
    private readonly contactUseCases: ContactUseCases,
    private readonly listLeads: ListLeadsUseCase,
    private readonly updateLead: UpdateLeadStatusUseCase,
  ) {}

  create(dto: CreateContactRequestDto, remoteIp?: string) {
    return this.contactUseCases.create(dto, remoteIp);
  }

  list(input: ListLeadsInput) {
    return this.listLeads.execute(input);
  }

  updateStatus(id: string, status: ContactRequestStatus) {
    return this.updateLead.execute(id, status);
  }
}
