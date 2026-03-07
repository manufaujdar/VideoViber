import { NextRequest, NextResponse } from 'next/server';

type RateLimitConfig = {
  scope: string;
  limit: number;
  windowMs: number;
};

type GuardConfig = {
  requireSameOrigin?: boolean;
  requireSessionInProduction?: boolean;
  rateLimit?: RateLimitConfig;
};

type GuardResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type JsonBodyResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type RateBucket = {
  count: number;
  resetAt: number;
};

const RATE_BUCKETS = new Map<string, RateBucket>();
const AUTH_COOKIE_PATTERN = /^sb-.+-auth-token(?:\.\d+)?$/;
const DEFAULT_MAX_JSON_BYTES = 64 * 1024;

function toErrorResponse(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error,
      ...(extra || {}),
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

function toRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: 'Too many requests. Please wait before retrying.',
    },
    {
      status: 429,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

function extractClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const candidate = forwardedFor?.split(',')[0]?.trim();

  if (candidate && candidate.length > 0) {
    return candidate;
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 120) || 'unknown-agent';
  return `ua:${userAgent}`;
}

function hasSessionCookie(request: NextRequest) {
  const cookies = request.cookies.getAll();
  return cookies.some((cookie) => AUTH_COOKIE_PATTERN.test(cookie.name));
}

function isSameOriginRequest(request: NextRequest) {
  const expectedOrigin = request.nextUrl.origin;
  const originHeader = request.headers.get('origin');

  if (originHeader && originHeader.trim().length > 0) {
    return originHeader === expectedOrigin;
  }

  const refererHeader = request.headers.get('referer');
  if (refererHeader && refererHeader.trim().length > 0) {
    try {
      return new URL(refererHeader).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return true;
}

function checkRateLimit(request: NextRequest, config: RateLimitConfig) {
  const now = Date.now();
  const client = extractClientIdentifier(request);
  const bucketKey = `${config.scope}:${client}`;

  const existing = RATE_BUCKETS.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    RATE_BUCKETS.set(bucketKey, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true as const };
  }

  if (existing.count >= config.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false as const, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true as const };
}

export function guardApiRequest(request: NextRequest, config: GuardConfig): GuardResult {
  if (config.requireSameOrigin !== false && !isSameOriginRequest(request)) {
    return {
      ok: false,
      response: toErrorResponse(403, 'Cross-origin request blocked.'),
    };
  }

  if (
    config.requireSessionInProduction &&
    process.env.NODE_ENV === 'production' &&
    !hasSessionCookie(request)
  ) {
    return {
      ok: false,
      response: toErrorResponse(401, 'Authentication required.'),
    };
  }

  if (config.rateLimit) {
    const limited = checkRateLimit(request, config.rateLimit);
    if (!limited.allowed) {
      return {
        ok: false,
        response: toRateLimitResponse(limited.retryAfterSeconds),
      };
    }
  }

  return { ok: true };
}

export async function parseJsonBodyWithLimit<T extends Record<string, unknown>>(
  request: NextRequest,
  maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<JsonBodyResult<T>> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      ok: false,
      response: toErrorResponse(415, 'Unsupported content type. Use application/json.'),
    };
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: toErrorResponse(413, 'Request payload is too large.'),
    };
  }

  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: toErrorResponse(400, 'Failed to read request body.'),
    };
  }

  if (!raw || raw.trim().length === 0) {
    return {
      ok: false,
      response: toErrorResponse(400, 'Request body must not be empty.'),
    };
  }

  if (new TextEncoder().encode(raw).length > maxBytes) {
    return {
      ok: false,
      response: toErrorResponse(413, 'Request payload is too large.'),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      response: toErrorResponse(400, 'Request body is not valid JSON.'),
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      response: toErrorResponse(400, 'Request body must be a JSON object.'),
    };
  }

  return {
    ok: true,
    data: parsed as T,
  };
}
