'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  defaultProviderRuntimeHealth,
  providerCatalog,
  type ProviderRuntimeHealth,
} from '@/lib/providers';
import { redactSensitiveText } from '@/lib/redaction';

type GeminiDiagnostics = {
  checkedAt: string;
  keyConfigured: boolean;
  veoModel: string;
  plannerModel: string;
  keyValid: boolean;
  veoModelAvailable: boolean;
  veoLongRunningSupported: boolean;
  healthy: boolean;
  hint?: string;
  error?: string;
  providerStatus?: string;
};

export default function ApiKeysPage() {
  const [providerHealth, setProviderHealth] = useState<ProviderRuntimeHealth[]>(
    defaultProviderRuntimeHealth
  );
  const [geminiDiagnostics, setGeminiDiagnostics] = useState<GeminiDiagnostics | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadHealth = async () => {
      try {
        const response = await fetch('/api/generate?diagnostics=deep', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!mounted || !Array.isArray(payload?.providers)) {
          return;
        }

        const parsed = payload.providers.filter(
          (item: unknown): item is ProviderRuntimeHealth =>
            Boolean(
              item &&
                typeof item === 'object' &&
                'id' in item &&
                'configured' in item &&
                'serverImplemented' in item
            )
        );

        if (parsed.length > 0) {
          setProviderHealth(parsed);
        }

        if (payload?.diagnostics?.gemini && typeof payload.diagnostics.gemini === 'object') {
          const raw = payload.diagnostics.gemini as GeminiDiagnostics;
          setGeminiDiagnostics({
            ...raw,
            error: raw.error ? redactSensitiveText(raw.error, 300) : undefined,
            hint: raw.hint ? redactSensitiveText(raw.hint, 300) : undefined,
            providerStatus: raw.providerStatus
              ? redactSensitiveText(raw.providerStatus, 80)
              : undefined,
          });
        }
      } catch {
        // Keep defaults if API diagnostics endpoint is unavailable.
      }
    };

    loadHealth();

    return () => {
      mounted = false;
    };
  }, []);

  const healthByProvider = useMemo(
    () =>
      providerHealth.reduce(
        (acc, provider) => {
          acc[provider.id] = provider;
          return acc;
        },
        {} as Record<string, ProviderRuntimeHealth>
      ),
    [providerHealth]
  );

  const configuredCount = providerHealth.filter((provider) => provider.configured).length;
  const implementedCount = providerHealth.filter((provider) => provider.serverImplemented).length;

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl space-y-8">
      <div>
        <div className="vv-badge bg-accent/10 text-accent mb-3 font-mono tracking-widest">System Health</div>
        <h1 className="text-3xl font-bold tracking-tight">Engine Diagnostics</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Real-time visualization of generative engine connections via <code className="text-vv-primary bg-white/5 px-1.5 py-0.5 rounded font-mono text-[11px]">/api/generate</code>, confirming implementation and environment variables.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4 text-sm font-mono tracking-tight">
          <span className="vv-badge bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/20">
            Implemented Engines: {implementedCount}
          </span>
          <span className="vv-badge bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
            Configured Engines: {configuredCount}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {providerCatalog.map((provider) => {
          const runtime = healthByProvider[provider.id];
          const isImplemented = runtime?.serverImplemented ?? false;
          const isConfigured = runtime?.configured ?? false;

          return (
            <article key={provider.id} className="vv-card-hover glass-strong border-white/5 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${provider.gradient} text-accent ring-accent/10 text-lg font-bold ring-1`}
                  >
                    {provider.letter}
                  </div>
                  <div>
                    <h3 className="font-bold">{provider.name}</h3>
                    <p className="text-vv-secondary mt-0.5 text-sm">{provider.description}</p>
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent-hover mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                      Provider Docs
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span
                    className={`vv-badge font-mono text-[10px] uppercase tracking-wider ${
                      isImplemented
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                        : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                    }`}
                  >
                    {isImplemented ? 'Adapter Ready' : 'Adapter Pending'}
                  </span>
                  <span
                    className={`vv-badge font-mono text-[10px] uppercase tracking-wider ${
                      isConfigured
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                        : 'bg-red-500/15 text-red-300 ring-1 ring-red-400/30 shadow-[0_0_10px_rgba(248,113,113,0.2)]'
                    }`}
                  >
                    {isConfigured ? 'Env Configured' : 'Missing Env'}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-vv-muted mb-2 text-xs uppercase tracking-wider font-semibold">
                  Required System Variables
                </p>
                <div className="flex flex-wrap gap-2">
                  {provider.envVars.map((envVar) => (
                    <span key={envVar} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-vv-primary">
                      {envVar}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="bg-vv-surface/50 rounded-xl border border-white/5 p-5 backdrop-blur-sm">
        <h3 className="text-vv-secondary mb-3 text-sm font-bold">System Setup Protocol</h3>
        <ol className="text-vv-muted list-decimal space-y-2 pl-5 text-sm">
          <li>Inject provider keys into <code className="text-vv-primary bg-white/5 px-1.5 py-0.5 rounded font-mono text-[11px]">.env.local</code>.</li>
          <li>Reboot the dev server via <code className="text-vv-primary bg-white/5 px-1.5 py-0.5 rounded font-mono text-[11px]">pnpm --filter @videoviber/web dev:reset</code>.</li>
          <li>Reload this console and confirm engines read <code className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono text-[11px]">Env Configured</code>.</li>
        </ol>
      </div>

      {geminiDiagnostics && (
        <div className="rounded-xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-vv-secondary mb-3 text-sm font-bold">Gemini Runtime Diagnostics</h3>
          <div className="flex flex-wrap gap-2">
            <span
              className={`vv-badge ${
                geminiDiagnostics.healthy
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'bg-amber-500/10 text-amber-300'
              }`}
            >
              {geminiDiagnostics.healthy ? 'Ready for Veo Calls' : 'Needs Attention'}
            </span>
            <span className="vv-badge bg-blue-500/10 text-blue-300">
              Key Configured: {geminiDiagnostics.keyConfigured ? 'yes' : 'no'}
            </span>
            <span className="vv-badge bg-indigo-500/10 text-indigo-300">
              Veo Model: {geminiDiagnostics.veoModel}
            </span>
          </div>

          <div className="text-vv-muted mt-4 space-y-1 text-sm">
            <p>Planner model: {geminiDiagnostics.plannerModel}</p>
            <p>Key valid for model list: {geminiDiagnostics.keyValid ? 'yes' : 'no'}</p>
            <p>Veo model visible: {geminiDiagnostics.veoModelAvailable ? 'yes' : 'no'}</p>
            <p>
              predictLongRunning supported:{' '}
              {geminiDiagnostics.veoLongRunningSupported ? 'yes' : 'no'}
            </p>
            <p>Checked at: {new Date(geminiDiagnostics.checkedAt).toLocaleString()}</p>
          </div>

          {(geminiDiagnostics.error || geminiDiagnostics.hint) && (
            <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/5 p-3 text-sm">
              {geminiDiagnostics.error && (
                <p className="text-amber-200">
                  <strong>Error:</strong> {geminiDiagnostics.error}
                </p>
              )}
              {geminiDiagnostics.hint && (
                <p className="text-amber-100">
                  <strong>Hint:</strong> {geminiDiagnostics.hint}
                </p>
              )}
              {geminiDiagnostics.providerStatus && (
                <p className="text-amber-100">
                  <strong>Status:</strong> {geminiDiagnostics.providerStatus}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
