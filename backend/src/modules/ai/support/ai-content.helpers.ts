import { TaskPriority, UserRole } from '@prisma/client';
import { ROLE_PROMPT_MAP } from '../prompts';

// Pattern: Stateless helpers — pure functions shared across AI use cases

export function tryParseJson<T = unknown>(
  content: string,
): T | { raw: string } {
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
    return JSON.parse(content) as T;
  } catch {
    return { raw: content };
  }
}

export function maskSensitiveData(input: string): string {
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/\b(?:\+?84|0)(?:\d[\s.-]?){8,10}\b/g, '[PHONE]')
    .replace(/\b\d{9,16}\b/g, '[ID]');
}

export function toTaskPriority(impact?: string): TaskPriority {
  if (impact === 'HIGH') return 'HIGH';
  if (impact === 'LOW') return 'LOW';
  return 'MEDIUM';
}

export function roleDirective(role?: UserRole): string {
  if (!role) return '';
  return ROLE_PROMPT_MAP[role] || '';
}

export function estimateCostUsd(inputTokens = 0, outputTokens = 0): number {
  const inputCost = (inputTokens / 1_000_000) * 3;
  const outputCost = (outputTokens / 1_000_000) * 15;
  return inputCost + outputCost;
}

export function isProviderUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const anyError = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
  };

  const status = anyError.status ?? anyError.statusCode;
  if (status === 429 || (typeof status === 'number' && status >= 500)) {
    return true;
  }

  const code = String(anyError.code || '').toUpperCase();
  if (
    [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'ECONNREFUSED',
    ].includes(code)
  ) {
    return true;
  }

  const message = String(anyError.message || '').toLowerCase();
  return /timeout|network|socket|temporarily unavailable|overloaded|rate limit/.test(
    message,
  );
}

export const AI_MODEL = 'claude-sonnet-4-20250514';
