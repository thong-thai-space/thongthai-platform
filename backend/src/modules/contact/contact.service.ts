import { Injectable } from '@nestjs/common';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactUseCases } from './use-cases/contact.use-cases';

@Injectable()
export class ContactService {
  constructor(private contactUseCases: ContactUseCases) {}

  async create(dto: CreateContactRequestDto) {
    return this.contactUseCases.create(dto);
  }
}
