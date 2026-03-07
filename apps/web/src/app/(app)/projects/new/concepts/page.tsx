'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { ConceptVariations, ConceptDirection } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  concepts: ConceptVariations & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

export default function ConceptsPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const researchSummary = useWizardStore((s) => s.researchSummary);
  const strategyBrief = useWizardStore((s) => s.strategyBrief);
  const contextBible = useWizardStore((s) => s.contextBible);
  const conceptVariations = useWizardStore((s) => s.conceptVariations);
  const setConceptVariations = useWizardStore((s) => s.setConceptVariations);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/concepts',
  });

  useEffect(() => {
    setCurrentPage(9);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      rawIdea: ideaIntake.rawIdea,
      requirementReport: requirementReport.data,
      strategyBrief: strategyBrief.data,
      contextBible: contextBible.data,
      researchSummary: researchSummary.data,
    });
    if (result?.success && result.concepts) {
      const { confidence: _c, assumptions: _a, ...conceptData } = result.concepts;
      setConceptVariations(conceptData as ConceptVariations, result.confidence, result.assumptions);
    }
  }, [agent, ideaIntake, requirementReport.data, strategyBrief.data, contextBible.data, researchSummary.data, setConceptVariations]);

  // Auto-run
  useEffect(() => {
    if (conceptVariations.status === 'empty') {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectConcept = useCallback(
    (conceptId: string) => {
      if (!conceptVariations.data) return;
      const updatedDirections = conceptVariations.data.directions.map((d) => ({
        ...d,
        selected: d.id === conceptId,
      }));
      setConceptVariations(
        { directions: updatedDirections, selectedId: conceptId },
        conceptVariations.confidence,
        conceptVariations.assumptions
      );
    },
    [conceptVariations, setConceptVariations]
  );

  const selectedConcept = conceptVariations.data?.directions.find((d) => d.selected);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Concept <span className="gradient-text">Variations</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI generates distinct creative directions. Select the one that best fits your vision.
        </p>
      </div>

      <AiAgentCard
        agentName="Concept Generator"
        description="Creates 3 distinct creative concept directions from your approved data"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
        loadingText="Generating concepts…"
      >
        {conceptVariations.data && (
          <ReviewGate
            document={conceptVariations}
            title="Concept Variations"
            onApprove={() => updateDocumentStatus('conceptVariations', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-4">
              {/* Concept cards */}
              <div className="grid gap-4">
                {conceptVariations.data.directions.map((concept, idx) => {
                  const isSelected = concept.selected;
                  const styleColors = [
                    { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', ring: 'ring-cyan-500/40', text: 'text-cyan-300' },
                    { border: 'border-violet-500/30', bg: 'bg-violet-500/10', ring: 'ring-violet-500/40', text: 'text-violet-300' },
                    { border: 'border-amber-500/30', bg: 'bg-amber-500/10', ring: 'ring-amber-500/40', text: 'text-amber-300' },
                  ][idx % 3]!;

                  return (
                    <button
                      key={concept.id}
                      onClick={() => selectConcept(concept.id)}
                      className={`group w-full rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                        isSelected
                          ? `${styleColors.border} ${styleColors.bg} ring-2 ${styleColors.ring} shadow-lg`
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Header */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                              isSelected ? `${styleColors.bg} ${styleColors.text}` : 'bg-white/5 text-vv-muted'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <h3 className="text-base font-semibold text-vv-primary">{concept.name}</h3>
                        </div>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                            isSelected
                              ? `${styleColors.border} ${styleColors.bg}`
                              : 'border-white/20'
                          }`}
                        >
                          {isSelected && (
                            <svg className={`h-3.5 w-3.5 ${styleColors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mb-3 text-sm leading-relaxed text-vv-secondary">{concept.description}</p>

                      {/* Details grid */}
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          { label: 'Approach', value: concept.approach },
                          { label: 'Visual Mood', value: concept.visualMood },
                          { label: 'Narrative', value: concept.narrativeStyle },
                        ].map((detail) =>
                          detail.value ? (
                            <div key={detail.label} className="rounded-lg bg-white/[0.03] p-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-vv-muted">{detail.label}</p>
                              <p className="mt-0.5 text-xs text-vv-secondary line-clamp-2">{detail.value}</p>
                            </div>
                          ) : null
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selection status */}
              {selectedConcept ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300">✓</span>
                    <p className="text-sm text-emerald-200">
                      Selected: <strong>{selectedConcept.name}</strong> — this direction will guide the script writing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300">☝</span>
                    <p className="text-sm text-amber-200">Select a concept direction to continue.</p>
                  </div>
                </div>
              )}
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
