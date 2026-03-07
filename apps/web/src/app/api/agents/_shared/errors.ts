import { toPublicErrorMessage } from '@/lib/redaction';

export function toAgentErrorMessage(error: unknown, fallback: string) {
  return toPublicErrorMessage(error, fallback, 320);
}
