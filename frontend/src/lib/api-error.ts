import { AxiosError } from 'axios';

// Pattern: Pure helper — single place that knows the backend error envelope shape
// (matches GlobalExceptionFilter in backend: { success: false, error: { message } }
// and the older flat shape { message }).
export function extractApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | {
          message?: string | string[];
          error?: { message?: string };
        }
      | undefined;

    const flat = data?.message;
    if (Array.isArray(flat) && flat.length > 0) return String(flat[0]);
    if (typeof flat === 'string' && flat.trim()) return flat;

    const envelope = data?.error?.message;
    if (typeof envelope === 'string' && envelope.trim()) return envelope;

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
