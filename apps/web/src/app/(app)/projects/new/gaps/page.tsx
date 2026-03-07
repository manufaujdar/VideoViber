'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { GapChecklist } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  gaps: GapChecklist & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

const severityConfig = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/20', icon: '🔴' },
  important: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/20', icon: '🟡' },
  optional: { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/20', icon: '🔵' },
};

export default function GapsPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const researchSummary = useWizardStore((s) => s.researchSummary);
  const gapChecklist = useWizardStore((s) => s.gapChecklist);
  const setGapChecklist = useWizardStore((s) => s.setGapChecklist);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/gaps',
  });

  useEffect(() => {
    setCurrentPage(4);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      rawIdea: ideaIntake.rawIdea,
      requirementReport: requirementReport.data,
      researchSummary: researchSummary.data,
    });
    if (result?.success && result.gaps) {
      const { confidence: _c, assumptions: _a, ...gapData } = result.gaps;
      setGapChecklist(gapData as GapChecklist, result.confidence, result.assumptions);
    }
  }, [agent, ideaIntake.rawIdea, requirementReport.data, researchSummary.data, setGapChecklist]);

  // Auto-run
  useEffect(() => {
    if (gapChecklist.status === 'empty') {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGapItem = useCallback(
    (gapId: string, updates: { filled?: boolean; skipped?: boolean; userInput?: string }) => {
      if (!gapChecklist.data) return;
      const updatedItems = gapChecklist.data.items.map((item) =>
        item.id === gapId ? { ...item, ...updates } : item
      );
      setGapChecklist(
        { ...gapChecklist.data, items: updatedItems },
        gapChecklist.confidence,
        gapChecklist.assumptions
      );
    },
    [gapChecklist, setGapChecklist]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Gap <span className="gradient-text">Detection</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          Identify and fill missing information before creating your project.
        </p>
      </div>

      <AiAgentCard
        agentName="Gap Detector"
        description="Finds missing requirements that could impact production quality"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
      >
        {gapChecklist.data && (
          <ReviewGate
            document={gapChecklist}
            title="Gap Checklist"
            onApprove={() => updateDocumentStatus('gapChecklist', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-3">
              {gapChecklist.data.summary && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-sm text-vv-secondary">{gapChecklist.data.summary}</p>
                </div>
              )}

              {gapChecklist.data.items.map((gap) => {
                const sev = severityConfig[gap.severity] || severityConfig.optional;
                return (
                  <div
                    key={gap.id}
                    className={`rounded-xl border p-4 transition-all ${
                      gap.filled
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : gap.skipped
                          ? 'border-white/[0.04] bg-white/[0.01] opacity-60'
                          : `${sev.border} ${sev.bg}`
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{sev.icon}</span>
                        <h4 className="text-sm font-semibold text-vv-primary">{gap.area}</h4>
                        <span className={`vv-badge text-[10px] ${sev.bg} ${sev.text}`}>
                          {gap.severity}
                        </span>
                      </div>
                      {gap.filled && (
                        <span className="vv-badge bg-emerald-500/10 text-emerald-300 text-[10px]">✓ Filled</span>
                      )}
                      {gap.skipped && (
                        <span className="vv-badge bg-white/5 text-vv-muted text-[10px]">Skipped</span>
                      )}
                    </div>

                    <p className="mb-3 text-xs text-vv-secondary">{gap.description}</p>

                    {!gap.filled && !gap.skipped && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={gap.userInput}
                          onChange={(e) => updateGapItem(gap.id, { userInput: e.target.value })}
                          placeholder="Fill this gap..."
                          className="vv-input flex-1 text-xs"
                        />
                        <button
                          onClick={() => updateGapItem(gap.id, { filled: true })}
                          disabled={!gap.userInput.trim()}
                          className="vv-btn-primary px-3 py-2 text-xs disabled:opacity-40"
                        >
                          Fill
                        </button>
                        <button
                          onClick={() => updateGapItem(gap.id, { skipped: true })}
                          className="vv-btn-ghost px-3 py-2 text-xs text-vv-muted"
                        >
                          Skip
                        </button>
                      </div>
                    )}

                    {gap.filled && gap.userInput && (
                      <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2 mt-1">
                        <p className="text-xs text-emerald-200">{gap.userInput}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Progress summary */}
              <div className="rounded-lg bg-white/[0.02] p-3 text-center">
                <p className="text-xs text-vv-muted">
                  {gapChecklist.data.items.filter((g) => g.filled).length} filled ·{' '}
                  {gapChecklist.data.items.filter((g) => g.skipped).length} skipped ·{' '}
                  {gapChecklist.data.items.filter((g) => !g.filled && !g.skipped).length} remaining
                </p>
              </div>
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
