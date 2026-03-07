'use client';

import type { ReactNode } from 'react';

interface AiAgentCardProps {
  agentName: string;
  description: string;
  loading: boolean;
  error: string | null;
  onTrigger: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

export function AiAgentCard({
  agentName,
  description,
  loading,
  error,
  onTrigger,
  disabled,
  children,
}: AiAgentCardProps) {
  return (
    <div className="vv-card relative overflow-hidden">
      {/* Agent header */}
      <div className="mb-4 flex items-center gap-3">
        {/* Agent avatar */}
        <div className="relative">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 ${
              loading
                ? 'bg-cyan-500/20 shadow-[0_0_20px_rgba(82,222,255,0.3)]'
                : 'bg-gradient-to-br from-cyan-500/15 to-violet-500/15'
            }`}
          >
            <svg
              className={`h-5 w-5 text-cyan-300 ${loading ? 'animate-pulse' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          </div>
          {loading && (
            <span className="absolute -inset-1 rounded-2xl border border-cyan-400/20 animate-ping" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-vv-primary">{agentName}</h4>
          <p className="text-xs text-vv-muted">{description}</p>
        </div>

        <button
          onClick={onTrigger}
          disabled={disabled || loading}
          className="vv-btn-secondary text-sm disabled:opacity-40"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
              Run Agent
            </>
          )}
        </button>
      </div>

      {/* Loading animation */}
      {loading && (
        <div className="mb-4 space-y-2.5 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-xs text-cyan-300/60">Agent is thinking…</span>
          </div>
          <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
          <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
          <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && children}
    </div>
  );
}
