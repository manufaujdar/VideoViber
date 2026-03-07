import type { BillingSummary } from './types';

export type UsageEventRow = {
  quantity: number | null;
  unit: string | null;
};

export type BillingEventRow = {
  amount_cents: number | null;
  currency: string | null;
  created_at: string | null;
};

function round(value: number, precision = 3) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function usageQuantityToHours(quantity: number | null, unit: string | null) {
  if (!isFiniteNumber(quantity)) {
    return 0;
  }

  const normalizedUnit = (unit || '').trim().toLowerCase();
  if (normalizedUnit.length === 0) {
    return 0;
  }

  if (normalizedUnit.includes('hour') || normalizedUnit === 'h' || normalizedUnit === 'hr' || normalizedUnit === 'hrs') {
    return quantity;
  }

  if (normalizedUnit.includes('minute') || normalizedUnit === 'min' || normalizedUnit === 'mins') {
    return quantity / 60;
  }

  if (normalizedUnit.includes('second') || normalizedUnit === 'sec' || normalizedUnit === 'secs') {
    return quantity / 3600;
  }

  if (normalizedUnit.includes('millisecond') || normalizedUnit === 'ms') {
    return quantity / 3600000;
  }

  return 0;
}

export function summarizeBillingPeriod(
  usageRows: UsageEventRow[],
  billingRows: BillingEventRow[],
  periodMeta: Pick<BillingSummary, 'periodLabel' | 'periodStartIso' | 'periodEndIso'>
): BillingSummary {
  const usageHours = round(
    usageRows.reduce((total, row) => total + usageQuantityToHours(row.quantity, row.unit), 0)
  );
  const usageEventCount = usageRows.filter((row) => isFiniteNumber(row.quantity)).length;

  const spendCents = billingRows.reduce(
    (total, row) => total + (isFiniteNumber(row.amount_cents) ? row.amount_cents : 0),
    0
  );

  const currency =
    billingRows.find((row) => typeof row.currency === 'string' && row.currency.trim().length > 0)
      ?.currency?.toUpperCase() || 'USD';

  const lastBillingAt =
    billingRows
      .map((row) => row.created_at)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .sort()
      .at(-1) || null;

  return {
    ...periodMeta,
    usageHours,
    usageEventCount,
    spendCents,
    currency,
    lastBillingAt,
  };
}
