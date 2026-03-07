'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { ResearchSummary, ResearchCard } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  research: ResearchSummary & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  trend: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/20' },
  competitor: { bg: 'bg-violet-500/10', text: 'text-violet-300', border: 'border-violet-500/20' },
  opportunity: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  avoid: { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/20' },
  hook: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/20' },
  style: { bg: 'bg-pink-500/10', text: 'text-pink-300', border: 'border-pink-500/20' },
};

export default function ResearchPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const researchSummary = useWizardStore((s) => s.researchSummary);
  const setResearchSummary = useWizardStore((s) => s.setResearchSummary);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/research',
  });

  useEffect(() => {
    setCurrentPage(3);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      rawIdea: ideaIntake.rawIdea,
      targetPlatform: ideaIntake.targetPlatform,
      roughAudience: ideaIntake.roughAudience,
      videoGoal: ideaIntake.videoGoal,
      requirementReport: requirementReport.data,
    });
    if (result?.success && result.research) {
      const { confidence: _c, assumptions: _a, ...researchData } = result.research;
      setResearchSummary(researchData as ResearchSummary, result.confidence, result.assumptions);
    }
  }, [agent, ideaIntake, requirementReport.data, setResearchSummary]);

  const toggleCard = useCallback(
    (cardId: string) => {
      if (!researchSummary.data) return;
      const updatedCards = researchSummary.data.cards.map((c) =>
        c.id === cardId ? { ...c, selected: !c.selected } : c
      );
      setResearchSummary(
        { ...researchSummary.data, cards: updatedCards },
        researchSummary.confidence,
        researchSummary.assumptions
      );
    },
    [researchSummary, setResearchSummary]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Trend &amp; Topic <span className="gradient-text">Research</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI researches trends, audience patterns, and content opportunities for your topic.
          Select the insights you want to incorporate.
        </p>
      </div>

      <AiAgentCard
        agentName="Trend Researcher"
        description="Analyzes platform trends, audience patterns, and competitive landscape"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
      >
        {researchSummary.data && (
          <ReviewGate
            document={researchSummary}
            title="Research Summary"
            onApprove={() => updateDocumentStatus('researchSummary', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-4">
              {/* Summary sections */}
              {[
                { label: 'Trend Summary', value: researchSummary.data.trendSummary },
                { label: 'Competitor Analysis', value: researchSummary.data.competitorSummary },
                { label: 'Content Opportunities', value: researchSummary.data.contentOpportunities },
                { label: 'Angles to Avoid', value: researchSummary.data.anglesToAvoid },
                { label: 'Recommended Directions', value: researchSummary.data.recommendedDirections },
              ]
                .filter((s) => s.value)
                .map((s) => (
                  <div key={s.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-vv-muted">{s.label}</h4>
                    <p className="text-sm leading-relaxed text-vv-secondary whitespace-pre-line">{s.value}</p>
                  </div>
                ))}

              {/* Research cards */}
              {researchSummary.data.cards && researchSummary.data.cards.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-vv-primary">
                    Research Cards — select the insights to include
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {researchSummary.data.cards.map((card) => {
                      const colors = categoryColors[card.category] ?? categoryColors.trend!;
                      return (
                        <button
                          key={card.id}
                          onClick={() => toggleCard(card.id)}
                          className={`group rounded-xl border p-4 text-left transition-all duration-200 ${
                            card.selected
                              ? `${colors.border} ${colors.bg} shadow-lg`
                              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className={`vv-badge text-[10px] ${colors.bg} ${colors.text}`}>
                              {card.category}
                            </span>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                                card.selected
                                  ? 'border-cyan-400 bg-cyan-400/20'
                                  : 'border-white/20 bg-transparent'
                              }`}
                            >
                              {card.selected && (
                                <svg className="h-3 w-3 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <h5 className="text-sm font-semibold text-vv-primary">{card.title}</h5>
                          <p className="mt-1 text-xs text-vv-secondary line-clamp-3">{card.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-vv-muted">
                    {researchSummary.data.cards.filter((c) => c.selected).length} of{' '}
                    {researchSummary.data.cards.length} insights selected
                  </p>
                </div>
              )}
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
