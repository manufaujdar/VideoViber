import { NextResponse } from 'next/server';

function resolvePortalUrl() {
  return process.env.BILLING_PORTAL_URL || process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || '';
}

export async function POST() {
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
    new URL(portalUrl);
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
