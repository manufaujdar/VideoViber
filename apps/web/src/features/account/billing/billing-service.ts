import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { BillingActionResult, BillingSummary } from './types';
import {
  summarizeBillingPeriod,
  type BillingEventRow,
  type UsageEventRow,
} from './usage-aggregation';

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function getMonthRange(referenceDate: Date) {
  const start = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );

  return {
    periodStartIso: start.toISOString(),
    periodEndIso: end.toISOString(),
    periodLabel: formatMonthLabel(referenceDate),
  };
}

async function getAuthenticatedClient() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false as const,
      error:
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!user) {
    return { ok: false as const, error: 'Sign in to view billing usage.' };
  }

  return {
    ok: true as const,
    data: {
      supabase,
      user,
    },
  };
}

export async function loadBillingSummary(
  referenceDate = new Date()
): Promise<BillingActionResult<BillingSummary>> {
  const context = await getAuthenticatedClient();
  if (!context.ok) {
    return context;
  }

  const { supabase, user } = context.data;
  const range = getMonthRange(referenceDate);

  const [usageResult, billingResult] = await Promise.all([
    supabase
      .from('usage_events')
      .select('quantity,unit')
      .eq('user_id', user.id)
      .gte('created_at', range.periodStartIso)
      .lt('created_at', range.periodEndIso),
    supabase
      .from('billing_events')
      .select('amount_cents,currency,created_at')
      .eq('user_id', user.id)
      .gte('created_at', range.periodStartIso)
      .lt('created_at', range.periodEndIso),
  ]);

  if (usageResult.error) {
    return { ok: false, error: usageResult.error.message };
  }

  if (billingResult.error) {
    return { ok: false, error: billingResult.error.message };
  }

  const usageRows = Array.isArray(usageResult.data) ? (usageResult.data as UsageEventRow[]) : [];
  const billingRows = Array.isArray(billingResult.data)
    ? (billingResult.data as BillingEventRow[])
    : [];

  return {
    ok: true,
    data: summarizeBillingPeriod(usageRows, billingRows, range),
  };
}

async function parsePortalResponse(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

export async function requestBillingPortalUrl(): Promise<BillingActionResult<{ url: string }>> {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const payload = await parsePortalResponse(response);
  if (!response.ok) {
    return {
      ok: false,
      error:
        (typeof payload?.error === 'string' && payload.error) ||
        `Failed to open billing portal (${response.status}).`,
    };
  }

  const url = typeof payload?.url === 'string' ? payload.url.trim() : '';
  if (!url) {
    return { ok: false, error: 'Billing portal URL is missing from server response.' };
  }

  return { ok: true, data: { url } };
}
