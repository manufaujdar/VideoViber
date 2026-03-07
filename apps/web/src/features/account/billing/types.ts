export interface BillingSummary {
  periodStartIso: string;
  periodEndIso: string;
  periodLabel: string;
  usageHours: number;
  usageEventCount: number;
  spendCents: number;
  currency: string;
  lastBillingAt: string | null;
}

export type BillingActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
