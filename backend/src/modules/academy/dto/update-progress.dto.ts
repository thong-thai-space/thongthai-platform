import { IsIn } from 'class-validator';
import type { ProgressAction } from '../domain/academy.types';

export class UpdateProgressDto {
  @IsIn(['START', 'COMPLETE'])
  action: ProgressAction;
}
