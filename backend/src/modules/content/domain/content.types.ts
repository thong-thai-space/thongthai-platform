import type { Prisma } from '@prisma/client';

// A deep-partial override of a single next-intl namespace. Leaves are strings or
// string arrays; values may nest in plain objects (validated by the policy).
export type OverrideData = Prisma.InputJsonValue;

// Map of namespace -> override payload for one locale, as served to the frontend.
export type LocaleOverrides = Record<string, Prisma.JsonValue>;
