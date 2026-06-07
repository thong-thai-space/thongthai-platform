import { BadRequestException, Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import {
  AppLocale,
  EDITABLE_NAMESPACES,
  IMAGE_FIELDS,
  MAX_OVERRIDE_BYTES,
  MAX_OVERRIDE_DEPTH,
  SUPPORTED_LOCALES,
} from '../content.constants';
import type { OverrideData } from '../domain/content.types';

// Keys that could pollute Object.prototype once the payload is merged into the
// message catalog — rejected regardless of value type.
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

// Pattern: Policy — centralizes the validation rules for content overrides so the
// use cases stay focused on orchestration.
@Injectable()
export class ContentOverridePolicy {
  // Map a public lowercase locale ('vi' | 'en') to the Prisma Language enum.
  parseLocale(locale: string): Language {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
      throw new BadRequestException(`Unsupported locale: ${locale}`);
    }
    return (locale as AppLocale) === 'vi' ? Language.VI : Language.EN;
  }

  // Every supported locale as a Language enum — the single source of truth for
  // "all locales" (used by the shared-image flow).
  allLocales(): Language[] {
    return SUPPORTED_LOCALES.map((locale) => this.parseLocale(locale));
  }

  assertEditableNamespace(namespace: string): void {
    if (!(EDITABLE_NAMESPACES as readonly string[]).includes(namespace)) {
      throw new BadRequestException(`Namespace not editable: ${namespace}`);
    }
  }

  // Uploads may only target a registered image field, so the endpoint can't be
  // used to write arbitrary nested fields.
  assertImageField(namespace: string, field: string): void {
    if (!(IMAGE_FIELDS[namespace] ?? []).includes(field)) {
      throw new BadRequestException(
        `Not an image field: ${namespace}.${field}`,
      );
    }
  }

  // Validates a deep-partial override payload: plain object whose leaves are
  // strings or string arrays, nested only through plain objects. Returns the value
  // typed for persistence once it passes.
  validatePayload(data: unknown): OverrideData {
    if (!this.isPlainObject(data)) {
      throw new BadRequestException('Override data must be an object');
    }

    const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (size > MAX_OVERRIDE_BYTES) {
      throw new BadRequestException(
        `Override payload too large (${size} > ${MAX_OVERRIDE_BYTES} bytes)`,
      );
    }

    this.assertShape(data, 1);
    return data as OverrideData;
  }

  private assertShape(value: Record<string, unknown>, depth: number): void {
    if (depth > MAX_OVERRIDE_DEPTH) {
      throw new BadRequestException('Override payload nested too deeply');
    }

    for (const [key, child] of Object.entries(value)) {
      if (DANGEROUS_KEYS.includes(key)) {
        throw new BadRequestException(`Disallowed key: ${key}`);
      }
      if (typeof child === 'string') continue;
      if (this.isStringArray(child)) continue;
      if (this.isPlainObject(child)) {
        this.assertShape(child, depth + 1);
        continue;
      }
      throw new BadRequestException(
        `Invalid value at "${key}": only strings, string arrays, and nested objects are allowed`,
      );
    }
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    );
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
}
