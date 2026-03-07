import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { guardApiRequest, parseJsonBodyWithLimit } from './request-guard';

const env = process.env as Record<string, string | undefined>;

function buildRequest(options?: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}) {
  return new NextRequest(options?.url || 'https://app.video-viber.test/api/test', {
    method: options?.method || 'POST',
    headers: options?.headers,
    body: options?.body,
  });
}

afterEach(() => {
  env.NODE_ENV = 'test';
});

describe('guardApiRequest', () => {
  it('blocks cross-origin requests', () => {
    const request = buildRequest({
      headers: {
        origin: 'https://evil.example',
      },
    });

    const result = guardApiRequest(request, {
      requireSameOrigin: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it('requires auth cookie in production when enabled', () => {
    env.NODE_ENV = 'production';

    const request = buildRequest({
      headers: {
        origin: 'https://app.video-viber.test',
      },
    });

    const result = guardApiRequest(request, {
      requireSameOrigin: true,
      requireSessionInProduction: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('accepts auth cookie in production when enabled', () => {
    env.NODE_ENV = 'production';

    const request = buildRequest({
      headers: {
        origin: 'https://app.video-viber.test',
        cookie: 'sb-demo-auth-token=abc',
      },
    });

    const result = guardApiRequest(request, {
      requireSameOrigin: true,
      requireSessionInProduction: true,
    });

    expect(result.ok).toBe(true);
  });

  it('rate limits repeated requests for same client', () => {
    const scope = `test-rate-limit-${Date.now()}`;

    const first = guardApiRequest(buildRequest(), {
      rateLimit: {
        scope,
        limit: 1,
        windowMs: 60_000,
      },
    });

    const second = guardApiRequest(buildRequest(), {
      rateLimit: {
        scope,
        limit: 1,
        windowMs: 60_000,
      },
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.response.status).toBe(429);
    }
  });
});

describe('parseJsonBodyWithLimit', () => {
  it('parses valid JSON body', async () => {
    const request = buildRequest({
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ hello: 'world' }),
    });

    const result = await parseJsonBodyWithLimit<{ hello: string }>(request, 2048);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hello).toBe('world');
    }
  });

  it('rejects non-json content type', async () => {
    const request = buildRequest({
      headers: {
        'content-type': 'text/plain',
      },
      body: 'hello',
    });

    const result = await parseJsonBodyWithLimit(request, 2048);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(415);
    }
  });

  it('rejects payload over byte limit', async () => {
    const request = buildRequest({
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ value: 'x'.repeat(2000) }),
    });

    const result = await parseJsonBodyWithLimit(request, 100);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
    }
  });
});
