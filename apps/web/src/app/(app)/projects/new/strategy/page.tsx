'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { StrategyBrief } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  strategy: StrategyBrief & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

const strategySections: Array<{ key: keyof StrategyBrief; label: string; icon: string }> = [
  { key: 'contentObjective', label: 'Content Objective', icon: '🎯' },
  { key: 'narrativeStrategy', label: 'Narrative Strategy', icon: '📖' },
  { key: 'viewerJourney', label: 'Viewer Journey', icon: '🧭' },
  { key: 'videoStyle', label: 'Video Style', icon: '🎬' },
  { key: 'durationRecommendation', label: 'Duration', icon: '⏱' },
  { key: 'contentArchitecture', label: 'Content Architecture', icon: '🏗' },
];

export default function StrategyPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const researchSummary = useWizardStore((s) => s.researchSummary);
  const strategyBrief = useWizardStore((s) => s.strategyBrief);
  const setStrategyBrief = useWizardStore((s) => s.setStrategyBrief);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/strategy',
  });

  useEffect(() => {
    setCurrentPage(6);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      rawIdea: ideaIntake.rawIdea,
      targetPlatform: ideaIntake.targetPlatform,
      videoGoal: ideaIntake.videoGoal,
      requirementReport: requirementReport.data,
      researchSummary: researchSummary.data,
    });
    if (result?.success && result.strategy) {
      const { confidence: _c, assumptions: _a, ...strategyData } = result.strategy;
      setStrategyBrief(strategyData as StrategyBrief, result.confidence, result.assumptions);
    }
  }, [agent, ideaIntake, requirementReport.data, researchSummary.data, setStrategyBrief]);

  // Auto-run on first visit
  useEffect(() => {
    if (strategyBrief.status === 'empty') {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Strategic <span className="gradient-text">Planning</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI creates a strategic content plan — narrative approach, viewer journey, and content architecture.
        </p>
      </div>

      <AiAgentCard
        agentName="Strategy Planner"
        description="Converts approved requirements and research into a strategic content plan"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
      >
        {strategyBrief.data && (
          <ReviewGate
            document={strategyBrief}
            title="Strategy Brief"
            onApprove={() => updateDocumentStatus('strategyBrief', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-3">
              {strategySections.map(({ key, label, icon }) => {
                const value = strategyBrief.data?.[key];
                if (!value) return null;

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-base">{icon}</span>
                      <h4 className="text-sm font-semibold text-vv-primary">{label}</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-vv-secondary whitespace-pre-line">{value}</p>
                  </div>
                );
              })}
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
