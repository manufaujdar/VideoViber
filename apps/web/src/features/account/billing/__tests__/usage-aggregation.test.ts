import { describe, expect, it } from 'vitest';
import { summarizeBillingPeriod, usageQuantityToHours } from '../usage-aggregation';

describe('usageQuantityToHours', () => {
  it('normalizes common unit labels to hours', () => {
    expect(usageQuantityToHours(2, 'hours')).toBe(2);
    expect(usageQuantityToHours(120, 'minutes')).toBe(2);
    expect(usageQuantityToHours(7200, 'seconds')).toBe(2);
    expect(usageQuantityToHours(7200000, 'ms')).toBe(2);
  });

  it('returns zero for unknown units or invalid quantity', () => {
    expect(usageQuantityToHours(10, 'credits')).toBe(0);
    expect(usageQuantityToHours(null, 'hours')).toBe(0);
  });
});

describe('summarizeBillingPeriod', () => {
  it('aggregates usage, spend, and last billing timestamp', () => {
    const summary = summarizeBillingPeriod(
      [
        { quantity: 120, unit: 'minutes' },
        { quantity: 1800, unit: 'seconds' },
      ],
      [
        { amount_cents: 1299, currency: 'usd', created_at: '2026-03-02T12:00:00.000Z' },
        { amount_cents: 999, currency: 'usd', created_at: '2026-03-05T14:30:00.000Z' },
      ],
      {
        periodLabel: 'March 2026',
        periodStartIso: '2026-03-01T00:00:00.000Z',
        periodEndIso: '2026-04-01T00:00:00.000Z',
      }
    );

    expect(summary.usageHours).toBe(2.5);
    expect(summary.usageEventCount).toBe(2);
    expect(summary.spendCents).toBe(2298);
    expect(summary.currency).toBe('USD');
    expect(summary.lastBillingAt).toBe('2026-03-05T14:30:00.000Z');
  });
});
