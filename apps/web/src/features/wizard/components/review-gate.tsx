'use client';

import { useState, type ReactNode } from 'react';
import type { DocumentStatus, DocumentWithState } from '../wizard-types';

interface ReviewGateProps<T> {
  document: DocumentWithState<T>;
  title: string;
  onApprove: () => void;
  onEdit?: () => void;
  onRegenerate: () => void;
  onLockSection?: (sectionId: string) => void;
  onUnlockSection?: (sectionId: string) => void;
  regenerating?: boolean;
  children: ReactNode;
}

const statusConfig: Record<
  DocumentStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  empty: { label: 'Empty', color: 'text-vv-muted', bg: 'bg-white/5', icon: '○' },
  draft: { label: 'Draft', color: 'text-amber-300', bg: 'bg-amber-500/10', icon: '✎' },
  user_edited: { label: 'Edited', color: 'text-blue-300', bg: 'bg-blue-500/10', icon: '✏' },
  approved: { label: 'Approved', color: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: '✓' },
  locked: { label: 'Locked', color: 'text-violet-300', bg: 'bg-violet-500/10', icon: '🔒' },
  needs_review: { label: 'Needs Review', color: 'text-orange-300', bg: 'bg-orange-500/10', icon: '⚠' },
};

export function ReviewGate<T>({
  document,
  title,
  onApprove,
  onEdit,
  onRegenerate,
  regenerating,
  children,
}: ReviewGateProps<T>) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const cfg = statusConfig[document.status];
  const confidencePct = Math.round(document.confidence * 100);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="vv-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`vv-badge ${cfg.bg} ${cfg.color}`}>
            <span>{cfg.icon}</span>
            {cfg.label}
          </span>
          <h3 className="text-sm font-semibold text-vv-primary">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence meter */}
          {document.status !== 'empty' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-vv-muted">Confidence</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    confidencePct >= 80
                      ? 'bg-emerald-400'
                      : confidencePct >= 50
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-vv-secondary">{confidencePct}%</span>
            </div>
          )}

          {/* Assumptions toggle */}
          {document.assumptions.length > 0 && (
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="vv-badge bg-violet-500/10 text-violet-300 cursor-pointer hover:bg-violet-500/20 transition-colors"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              {document.assumptions.length} assumptions
            </button>
          )}
        </div>
      </div>

      {/* Assumptions disclosure */}
      {showAssumptions && document.assumptions.length > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 animate-scale-in">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
            AI Assumptions
          </h4>
          <ul className="space-y-1">
            {document.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-vv-secondary">
                <span className="mt-1 text-violet-400/60">▸</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Document content */}
      <div className="relative">
        {children}
      </div>

      {/* Action buttons */}
      {document.status !== 'empty' && (
        <div className="flex items-center gap-3 pt-2">
          {document.status !== 'approved' && document.status !== 'locked' && (
            <button onClick={onApprove} className="vv-btn-primary text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Approve
            </button>
          )}

          {onEdit && document.status !== 'locked' && (
            <button onClick={onEdit} className="vv-btn-secondary text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Edit
            </button>
          )}

          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="vv-btn-ghost text-sm text-amber-300/80 disabled:opacity-40"
          >
            <svg
              className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"
              />
            </svg>
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </button>

          {document.status === 'approved' && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-300/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approved — ready to proceed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
