import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Currency } from '@prisma/client';

// A quote ("báo giá") is a pre-sale document — generated and sent to a prospect
// before any invoice exists. It is intentionally NOT persisted (YAGNI): the
// request describes the document, the response is the rendered PDF.

export class QuoteItemDto {
  @IsString()
  @MaxLength(500)
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class QuoteDto {
  @IsString()
  @MaxLength(200)
  clientName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  clientPhone?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  /** ISO date the quote is valid until. */
  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  introNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}
