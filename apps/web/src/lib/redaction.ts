const REPLACEMENT = '[REDACTED]';

const SENSITIVE_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_\-]{20,}/g,
  /\bsk_live_[0-9A-Za-z]{16,}\b/g,
  /\bpk_live_[0-9A-Za-z]{16,}\b/g,
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  /\bghp_[0-9A-Za-z]{30,}\b/g,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|signature|sig|secret|password)=)[^&\s]+/gi,
  /((?:api[_-]?key|token|secret|password)\s*[:=]\s*['"]?)[A-Za-z0-9_\-.~+/=]{12,}/gi,
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function redactSensitiveText(value: string, maxLength = 600): string {
  if (!value) {
    return '';
  }

  let sanitized = normalizeWhitespace(value);

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, groupPrefix: string | undefined) => {
      if (typeof groupPrefix === 'string' && groupPrefix.length > 0) {
        return `${groupPrefix}${REPLACEMENT}`;
      }
      return REPLACEMENT;
    });
  }

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxLength - 1)}...`;
}

export function toPublicErrorMessage(error: unknown, fallback: string, maxLength = 320): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string' && error.trim().length > 0
        ? error
        : fallback;

  const safe = redactSensitiveText(message, maxLength);
  return safe.length > 0 ? safe : fallback;
}
