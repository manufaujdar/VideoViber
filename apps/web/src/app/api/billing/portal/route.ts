import { NextResponse, type NextRequest } from 'next/server';
import { guardApiRequest } from '@/app/api/_shared/request-guard';

function resolvePortalUrl() {
  return process.env.BILLING_PORTAL_URL || process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || '';
}

export async function POST(request: NextRequest) {
  const guard = guardApiRequest(request, {
    requireSameOrigin: true,
    requireSessionInProduction: true,
    rateLimit: {
      scope: 'api:billing:portal',
      limit: 12,
      windowMs: 60_000,
    },
  });

  if (!guard.ok) {
    return guard.response;
  }

  const portalUrl = resolvePortalUrl().trim();
  if (!portalUrl) {
    return NextResponse.json(
      {
        error:
          'Billing portal is not configured. Set BILLING_PORTAL_URL (or NEXT_PUBLIC_BILLING_PORTAL_URL).',
      },
      { status: 503 }
    );
  }

  try {
    // Validate URL format before sending to client.
    const parsed = new URL(portalUrl);
    if (parsed.username || parsed.password || parsed.hash) {
      return NextResponse.json(
        {
          error: 'Billing portal URL must not include embedded credentials or fragment values.',
        },
        { status: 500 }
      );
    }

    if (parsed.searchParams.size > 0) {
      return NextResponse.json(
        {
          error: 'Billing portal URL must not include query parameters.',
        },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return NextResponse.json(
        {
          error: 'Billing portal URL must use HTTPS in production.',
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: 'Billing portal URL is invalid. Check BILLING_PORTAL_URL format.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: portalUrl,
  });
}
