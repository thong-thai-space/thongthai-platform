import { IsNotEmpty, IsString } from 'class-validator';

export class AssignPlaybookDto {
  /** The client (User with role CLIENT) to deliver this playbook to. */
  @IsNotEmpty()
  @IsString()
  clientId: string;
}
