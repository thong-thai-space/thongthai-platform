import { IsEnum, IsNotEmpty } from 'class-validator';
import { ContactRequestStatus } from '@prisma/client';

export class UpdateLeadStatusDto {
  @IsNotEmpty()
  @IsEnum(ContactRequestStatus)
  status: ContactRequestStatus;
}
