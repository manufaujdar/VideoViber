'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { ReadinessReport, ReadinessCheckItem } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  readinessReport: ReadinessReport;
  confidence: number;
  assumptions: string[];
}

const STATUS_CONFIG: Record<ReadinessCheckItem['status'], { icon: string; color: string; bg: string; label: string }> = {
  pass: { icon: '✅', color: 'text-emerald-300', bg: 'bg-emerald-500/10', label: 'Pass' },
  warn: { icon: '⚠️', color: 'text-amber-300', bg: 'bg-amber-500/10', label: 'Warning' },
  fail: { icon: '❌', color: 'text-red-300', bg: 'bg-red-500/10', label: 'Fail' },
};

const OVERALL_CONFIG: Record<ReadinessReport['overallStatus'], { icon: string; color: string; border: string; bg: string; label: string }> = {
  ready: { icon: '🚀', color: 'text-emerald-200', border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.05]', label: 'Production Ready' },
  warnings: { icon: '⚠️', color: 'text-amber-200', border: 'border-amber-500/20', bg: 'bg-amber-500/[0.05]', label: 'Ready with Warnings' },
  not_ready: { icon: '🚫', color: 'text-red-200', border: 'border-red-500/20', bg: 'bg-red-500/[0.05]', label: 'Not Ready' },
};

export default function ReadinessPage() {
  const strategyBrief = useWizardStore((s) => s.strategyBrief);
  const contextBible = useWizardStore((s) => s.contextBible);
  const scriptDraft = useWizardStore((s) => s.scriptDraft);
  const sceneBreakdown = useWizardStore((s) => s.sceneBreakdown);
  const shotPlan = useWizardStore((s) => s.shotPlan);
  const audioPlan = useWizardStore((s) => s.audioPlan);
  const skippedPages = useWizardStore((s) => s.skippedPages);
  const readinessReport = useWizardStore((s) => s.readinessReport);
  const setReadinessReport = useWizardStore((s) => s.setReadinessReport);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/qa',
  });

  useEffect(() => {
    setCurrentPage(15);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      strategyBrief: strategyBrief.data,
      contextBible: contextBible.data,
      scriptDraft: scriptDraft.data,
      sceneBreakdown: sceneBreakdown.data,
      shotPlan: shotPlan.data,
      audioPlan: audioPlan.data,
      skippedPages,
    });
    if (result?.success && result.readinessReport) {
      setReadinessReport(result.readinessReport, result.confidence, result.assumptions);
    }
  }, [agent, strategyBrief.data, contextBible.data, scriptDraft.data, sceneBreakdown.data, shotPlan.data, audioPlan.data, skippedPages, setReadinessReport]);

  useEffect(() => {
    if (readinessReport.status === 'empty') {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats from checks
  const checks = readinessReport.data?.checks ?? [];
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Production <span className="gradient-text">Readiness</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI audits the entire production plan for quality, consistency, and completeness.
        </p>
      </div>

      <AiAgentCard
        agentName="QA Readiness"
        description="Audits strategy alignment, prompt quality, continuity, and completeness"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
        loadingText="Running QA audit…"
      >
        {readinessReport.data && (
          <ReviewGate
            document={readinessReport}
            title="Readiness Report"
            onApprove={() => updateDocumentStatus('readinessReport', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-5">
              {/* Overall status banner */}
              {(() => {
                const cfg = OVERALL_CONFIG[readinessReport.data!.overallStatus];
                return (
                  <div className={`flex items-center gap-4 rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}>
                    <span className="text-3xl">{cfg.icon}</span>
                    <div>
                      <h3 className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</h3>
                      <p className="mt-0.5 text-sm text-vv-secondary">{readinessReport.data!.summary}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Score bar */}
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-300">{passCount}</p>
                  <p className="text-[10px] text-vv-muted">Passed</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-300">{warnCount}</p>
                  <p className="text-[10px] text-vv-muted">Warnings</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-lg font-bold text-red-300">{failCount}</p>
                  <p className="text-[10px] text-vv-muted">Failed</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="flex-1">
                  {/* Progress bar */}
                  <div className="flex h-3 gap-0.5 rounded-full overflow-hidden">
                    {passCount > 0 && (
                      <div className="bg-emerald-500/60" style={{ width: `${(passCount / checks.length) * 100}%` }} />
                    )}
                    {warnCount > 0 && (
                      <div className="bg-amber-500/60" style={{ width: `${(warnCount / checks.length) * 100}%` }} />
                    )}
                    {failCount > 0 && (
                      <div className="bg-red-500/60" style={{ width: `${(failCount / checks.length) * 100}%` }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Check list */}
              <div className="space-y-2">
                {checks.map((check: ReadinessCheckItem) => {
                  const cfg = STATUS_CONFIG[check.status];
                  return (
                    <div
                      key={check.id}
                      className={`rounded-xl border border-white/[0.06] ${cfg.bg} p-3`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cfg.icon}</span>
                        <span className="flex-1 text-sm font-medium text-vv-primary">{check.check}</span>
                        <span className={`vv-badge ${cfg.bg} ${cfg.color} text-[10px] border border-white/[0.06]`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="mt-1 ml-6 text-xs text-vv-secondary">{check.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
