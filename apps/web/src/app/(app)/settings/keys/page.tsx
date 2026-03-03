'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  defaultProviderRuntimeHealth,
  providerCatalog,
  type ProviderRuntimeHealth,
} from '@/lib/providers';

export default function ApiKeysPage() {
  const [providerHealth, setProviderHealth] = useState<ProviderRuntimeHealth[]>(
    defaultProviderRuntimeHealth
  );

  useEffect(() => {
    let mounted = true;

    const loadHealth = async () => {
      try {
        const response = await fetch('/api/generate', { method: 'GET' });
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
        <div className="vv-badge bg-accent/10 text-accent mb-3">Integrations</div>
        <h1 className="text-2xl font-bold tracking-tight">Provider Diagnostics</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          This page reads server runtime status from <code>/api/generate</code> so developers can
          verify exactly which providers are implemented and configured.
        </p>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="vv-badge bg-blue-500/10 text-blue-300">
            Implemented Providers: {implementedCount}
          </span>
          <span className="vv-badge bg-emerald-500/10 text-emerald-300">
            Configured Providers: {configuredCount}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {providerCatalog.map((provider) => {
          const runtime = healthByProvider[provider.id];
          const isImplemented = runtime?.serverImplemented ?? false;
          const isConfigured = runtime?.configured ?? false;

          return (
            <article key={provider.id} className="vv-card-hover">
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
                    className={`vv-badge ${
                      isImplemented
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {isImplemented ? 'Adapter Ready' : 'Adapter Pending'}
                  </span>
                  <span
                    className={`vv-badge ${
                      isConfigured
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-red-500/10 text-red-300'
                    }`}
                  >
                    {isConfigured ? 'Env Configured' : 'Missing Env'}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-white/5 pt-4">
                <p className="text-vv-muted mb-2 text-xs uppercase tracking-wider">
                  Required Environment Variables
                </p>
                <div className="flex flex-wrap gap-2">
                  {provider.envVars.map((envVar) => (
                    <span key={envVar} className="rounded-md border border-white/10 px-2 py-1 font-mono text-xs">
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
        <h3 className="text-vv-secondary mb-3 text-sm font-bold">Developer Setup Checklist</h3>
        <ol className="text-vv-muted list-decimal space-y-2 pl-5 text-sm">
          <li>Add provider keys in <code>.env.local</code>.</li>
          <li>Restart the dev server with <code>pnpm --filter @videoviber/web dev:reset</code>.</li>
          <li>Reload this page and confirm providers show <code>Env Configured</code>.</li>
        </ol>
      </div>
    </div>
  );
}
