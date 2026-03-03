'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/app/store';

export default function GenerationsPage() {
  const generations = useAppStore((s) => s.generations);
  const updateGeneration = useAppStore((s) => s.updateGeneration);
  const [filter, setFilter] = useState<'All' | 'Processing' | 'Completed' | 'Failed'>('All');

  const statuses = [
    { key: 'processing', color: 'bg-blue-400', label: 'Processing' },
    { key: 'completed', color: 'bg-emerald-400', label: 'Completed' },
    { key: 'failed', color: 'bg-red-400', label: 'Failed' },
    { key: 'queued', color: 'bg-amber-400', label: 'Queued' },
  ];

  const filtered = generations.filter((g) => {
    if (filter === 'Processing') return g.status === 'processing' || g.status === 'queued';
    if (filter === 'Completed') return g.status === 'completed';
    if (filter === 'Failed') return g.status === 'failed';
    return true;
  });

  const elapsed = (startedAt: string, completedAt: string | null) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const s = Math.floor((end - start) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generations</h1>
          <p className="mt-1 text-sm text-vv-secondary">
            {generations.length} total · Track all video generation jobs
          </p>
        </div>
      </div>

      {/* Filter + Status legend */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', 'Processing', 'Completed', 'Failed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
              filter === f ? 'bg-accent/10 text-accent ring-1 ring-accent/20' : 'text-vv-secondary hover:bg-white/[0.03] hover:text-vv-primary'
            }`}
          >{f}</button>
        ))}
        <div className="ml-auto hidden items-center gap-3 text-xs text-vv-muted sm:flex">
          {statuses.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Generation List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((gen) => (
            <div key={gen.id} className="vv-card-hover">
              <div className="flex items-center gap-4">
                {/* Status indicator */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  gen.status === 'completed' ? 'bg-success/10 text-success' :
                  gen.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                  gen.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {gen.status === 'processing' ? (
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : gen.status === 'completed' ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : gen.status === 'failed' ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${gen.projectId}`} className="font-semibold text-sm hover:text-accent transition-colors truncate">
                      {gen.projectTitle}
                    </Link>
                    <span className="text-vv-disabled">·</span>
                    <span className="text-sm text-vv-secondary truncate">{gen.shotTitle}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-vv-muted capitalize">{gen.provider}</span>
                    <span className="text-xs text-vv-disabled">{elapsed(gen.startedAt, gen.completedAt)}</span>
                    {gen.error && <span className="text-xs text-red-400 truncate">{gen.error}</span>}
                  </div>
                </div>

                {/* Progress / Status */}
                <div className="flex items-center gap-3 shrink-0">
                  {(gen.status === 'processing' || gen.status === 'queued') && (
                    <>
                      <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-400 transition-all duration-300" style={{ width: `${gen.progress}%` }} />
                      </div>
                      <span className="text-xs font-mono text-blue-400 w-8">{gen.progress}%</span>
                      <button
                        onClick={() => updateGeneration(gen.id, { status: 'failed', error: 'Cancelled by user', completedAt: new Date().toISOString() })}
                        className="text-xs text-vv-muted hover:text-red-400 transition-colors"
                      >Cancel</button>
                    </>
                  )}
                  {gen.status === 'completed' && (
                    <span className="vv-badge bg-success/10 text-success text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Done
                    </span>
                  )}
                  {gen.status === 'failed' && (
                    <span className="vv-badge bg-red-500/10 text-red-400 text-xs">Failed</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="vv-card relative flex flex-col items-center overflow-hidden py-20">
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(82, 222, 255, 0.5) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 ring-1 ring-blue-500/20 animate-float">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-xl font-bold">{generations.length === 0 ? 'No generations yet' : 'No matching generations'}</h3>
            <p className="mb-4 max-w-sm text-center text-sm leading-relaxed text-vv-secondary">
              {generations.length === 0 ? 'Generate shots from your projects to track them here.' : 'Try changing your filter.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
