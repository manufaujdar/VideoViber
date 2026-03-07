'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadBillingSummary, requestBillingPortalUrl, type BillingSummary } from '@/features/account/billing';
import { toast } from 'sonner';

function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

export default function BillingSettingsPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSummary = useCallback(async () => {
    setLoading(true);
    const result = await loadBillingSummary();
    setLoading(false);

    if (!result.ok) {
      setSummary(null);
      setError(result.error);
      return;
    }

    setError(null);
    setSummary(result.data);
  }, []);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  const spendLabel = useMemo(() => {
    if (!summary) return '--';
    return formatCurrency(summary.spendCents, summary.currency);
  }, [summary]);

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    const result = await requestBillingPortalUrl();
    setLoadingPortal(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    window.location.assign(result.data.url);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in-up">
      <div>
        <div className="vv-badge bg-accent/10 text-accent mb-3 font-mono tracking-widest">Subscription</div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Review real usage and billing events synced from backend tables.
        </p>
      </div>

      <div className="vv-card-hover space-y-5 p-6 glass-strong border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Usage Summary</h2>
            <p className="text-sm text-vv-secondary mt-0.5">
              {summary ? summary.periodLabel : 'Current period'}
            </p>
          </div>
          <button onClick={() => void refreshSummary()} className="vv-btn-secondary px-3 py-2 text-xs">
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-vv-secondary text-sm">Loading billing metrics...</p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        ) : summary ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                <p className="text-vv-muted text-xs uppercase tracking-wide">Usage Hours</p>
                <p className="mt-1 text-lg font-semibold">{summary.usageHours.toFixed(2)}h</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                <p className="text-vv-muted text-xs uppercase tracking-wide">Usage Events</p>
                <p className="mt-1 text-lg font-semibold">{summary.usageEventCount}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                <p className="text-vv-muted text-xs uppercase tracking-wide">Billed This Month</p>
                <p className="mt-1 text-lg font-semibold">{spendLabel}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="text-xs text-vv-muted">
                Period: {new Date(summary.periodStartIso).toLocaleDateString()} -{' '}
                {new Date(summary.periodEndIso).toLocaleDateString()}
              </p>
              <p className="text-xs text-vv-muted mt-1">
                Last billing event:{' '}
                {summary.lastBillingAt
                  ? new Date(summary.lastBillingAt).toLocaleString()
                  : 'No billing event recorded this period.'}
              </p>
            </div>
          </>
        ) : null}

        <button
          onClick={handleManageBilling}
          disabled={loadingPortal}
          className="vv-btn-secondary w-full justify-center transition-all bg-white/5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingPortal ? 'Opening Portal...' : 'Manage Portal & Payment Methods'}
        </button>
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-[linear-gradient(45deg,rgba(139,92,246,0.05),rgba(139,92,246,0.1))] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <h3 className="text-lg font-bold text-violet-300">Need Higher Capacity?</h3>
        <p className="text-sm text-vv-secondary mt-1 mb-4 leading-relaxed max-w-[90%]">
          Compare available plans and upgrade based on your current generation volume.
        </p>
        <Link
          href="/pricing"
          className="inline-flex rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 px-5 py-2 text-sm font-semibold transition-colors ring-1 ring-violet-500/50"
        >
          Compare Studio Tiers
        </Link>
      </div>
    </div>
  );
}
