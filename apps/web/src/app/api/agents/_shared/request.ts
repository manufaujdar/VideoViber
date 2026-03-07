import { type NextRequest, type NextResponse } from 'next/server';
import { guardApiRequest, parseJsonBodyWithLimit } from '@/app/api/_shared/request-guard';

const AGENT_JSON_MAX_BYTES = 80 * 1024;

export type GuardedAgentBody =
  | {
      ok: true;
      body: Record<string, any>;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function parseGuardedAgentBody(
  request: NextRequest,
  routeName: string
): Promise<GuardedAgentBody> {
  const guard = guardApiRequest(request, {
    requireSameOrigin: true,
    requireSessionInProduction: true,
    rateLimit: {
      scope: `api:agents:${routeName}`,
      limit: 25,
      windowMs: 60_000,
    },
  });

  if (!guard.ok) {
    return guard;
  }

  const parsed = await parseJsonBodyWithLimit<Record<string, any>>(
    request,
    AGENT_JSON_MAX_BYTES
  );

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    body: parsed.data,
  };
}
