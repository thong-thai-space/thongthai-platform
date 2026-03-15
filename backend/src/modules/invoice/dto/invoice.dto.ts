import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, Currency } from '@prisma/client';

export class InvoiceItemDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  amount: number;
}

export class CreateInvoiceDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsNumber()
  totalUsd?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
