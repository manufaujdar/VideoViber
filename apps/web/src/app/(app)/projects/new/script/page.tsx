'use client';

import { useEffect, useCallback, useState } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { ScriptDraft, CritiqueReport } from '@/features/wizard/wizard-types';

interface ScriptResponse {
  success: boolean;
  script: ScriptDraft & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

interface CritiqueResponse {
  success: boolean;
  critique: CritiqueReport & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const pct = (score / 10) * 100;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="none" className="text-white/5" />
          <circle
            cx="32" cy="32" r="28"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-vv-primary">
          {score}
        </span>
      </div>
      <span className="text-xs text-vv-muted">{label}</span>
    </div>
  );
}

export default function ScriptPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const strategyBrief = useWizardStore((s) => s.strategyBrief);
  const contextBible = useWizardStore((s) => s.contextBible);
  const conceptVariations = useWizardStore((s) => s.conceptVariations);
  const scriptDraft = useWizardStore((s) => s.scriptDraft);
  const setScriptDraft = useWizardStore((s) => s.setScriptDraft);
  const critiqueReport = useWizardStore((s) => s.critiqueReport);
  const setCritiqueReport = useWizardStore((s) => s.setCritiqueReport);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const [activeTab, setActiveTab] = useState<'script' | 'critique'>('script');

  const scriptAgent = useAgent<Record<string, unknown>, ScriptResponse>({
    endpoint: '/api/agents/script',
  });
  const critiqueAgent = useAgent<Record<string, unknown>, CritiqueResponse>({
    endpoint: '/api/agents/critique',
  });

  useEffect(() => {
    setCurrentPage(10);
  }, [setCurrentPage]);

  const selectedConcept = conceptVariations.data?.directions.find((d) => d.selected);

  const runScriptAgent = useCallback(async () => {
    const result = await scriptAgent.call({
      rawIdea: ideaIntake.rawIdea,
      selectedConcept,
      requirementReport: requirementReport.data,
      strategyBrief: strategyBrief.data,
      contextBible: contextBible.data,
    });
    if (result?.success && result.script) {
      const { confidence: _c, assumptions: _a, ...scriptData } = result.script;
      setScriptDraft(scriptData as ScriptDraft, result.confidence, result.assumptions);
    }
  }, [scriptAgent, ideaIntake, selectedConcept, requirementReport.data, strategyBrief.data, contextBible.data, setScriptDraft]);

  const runCritiqueAgent = useCallback(async () => {
    if (!scriptDraft.data) return;
    const result = await critiqueAgent.call({
      scriptDraft: scriptDraft.data,
      requirementReport: requirementReport.data,
      strategyBrief: strategyBrief.data,
      contextBible: contextBible.data,
    });
    if (result?.success && result.critique) {
      const { confidence: _c, assumptions: _a, ...critiqueData } = result.critique;
      setCritiqueReport(critiqueData as CritiqueReport, result.confidence, result.assumptions);
      setActiveTab('critique');
    }
  }, [critiqueAgent, scriptDraft.data, requirementReport.data, strategyBrief.data, contextBible.data, setCritiqueReport]);

  // Auto-run script on first visit
  useEffect(() => {
    if (scriptDraft.status === 'empty') {
      runScriptAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Script <span className="gradient-text">Blueprint</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI writes the script, then a critic agent reviews it for quality.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {[
          { id: 'script' as const, label: 'Script', icon: '📝' },
          { id: 'critique' as const, label: 'Critique', icon: '🔍', disabled: !scriptDraft.data },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-vv-primary shadow-sm'
                : tab.disabled
                  ? 'text-vv-muted/40 cursor-not-allowed'
                  : 'text-vv-muted hover:text-vv-secondary'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Script tab */}
      {activeTab === 'script' && (
        <AiAgentCard
          agentName="Script Writer"
          description={`Writes a complete script${selectedConcept ? ` using the "${selectedConcept.name}" concept direction` : ''}`}
          loading={scriptAgent.loading}
          error={scriptAgent.error}
          onTrigger={runScriptAgent}
          loadingText="Writing script…"
        >
          {scriptDraft.data && (
            <ReviewGate
              document={scriptDraft}
              title="Script Draft"
              onApprove={() => updateDocumentStatus('scriptDraft', 'approved')}
              onRegenerate={runScriptAgent}
              regenerating={scriptAgent.loading}
            >
              <div className="space-y-4">
                {/* Script sections */}
                {[
                  { key: 'hook', label: '🎣 Hook', desc: 'First 3-5 seconds — attention grab' },
                  { key: 'body', label: '📖 Body', desc: 'Main content with visual notes' },
                  { key: 'cta', label: '📢 Call to Action', desc: 'Closing statement and CTA' },
                ].map(({ key, label, desc }) => {
                  const value = scriptDraft.data?.[key as keyof ScriptDraft];
                  if (!value) return null;
                  return (
                    <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-vv-primary">{label}</h4>
                        <span className="text-[10px] text-vv-muted">{desc}</span>
                      </div>
                      <div className="text-sm leading-relaxed text-vv-secondary whitespace-pre-line">{value}</div>
                    </div>
                  );
                })}

                {/* Visual notes */}
                {scriptDraft.data.visualNotes && (
                  <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-4">
                    <h4 className="mb-2 text-sm font-semibold text-violet-200">🎬 Visual Direction Notes</h4>
                    <p className="text-sm leading-relaxed text-vv-secondary whitespace-pre-line">
                      {scriptDraft.data.visualNotes}
                    </p>
                  </div>
                )}

                {/* Critique trigger */}
                {critiqueReport.status === 'empty' && (
                  <button
                    onClick={runCritiqueAgent}
                    disabled={critiqueAgent.loading}
                    className="vv-btn-secondary w-full py-3 text-sm"
                  >
                    {critiqueAgent.loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Critiquing…
                      </span>
                    ) : (
                      '🔍 Run Script Critique'
                    )}
                  </button>
                )}
              </div>
            </ReviewGate>
          )}
        </AiAgentCard>
      )}

      {/* Critique tab */}
      {activeTab === 'critique' && (
        <AiAgentCard
          agentName="Script Critic"
          description="Scores the script on clarity, retention, and persuasion"
          loading={critiqueAgent.loading}
          error={critiqueAgent.error}
          onTrigger={runCritiqueAgent}
          loadingText="Critiquing script…"
        >
          {critiqueReport.data && (
            <ReviewGate
              document={critiqueReport}
              title="Critique Report"
              onApprove={() => updateDocumentStatus('critiqueReport', 'approved')}
              onRegenerate={runCritiqueAgent}
              regenerating={critiqueAgent.loading}
            >
              <div className="space-y-5">
                {/* Score rings */}
                <div className="flex items-center justify-center gap-8">
                  <ScoreRing score={critiqueReport.data.clarityScore} label="Clarity" color="#22d3ee" />
                  <ScoreRing score={critiqueReport.data.retentionScore} label="Retention" color="#a78bfa" />
                  <ScoreRing score={critiqueReport.data.persuasionScore} label="Persuasion" color="#f59e0b" />
                </div>

                {/* Average */}
                <div className="text-center">
                  <span className="text-2xl font-bold text-vv-primary">
                    {(
                      (critiqueReport.data.clarityScore +
                        critiqueReport.data.retentionScore +
                        critiqueReport.data.persuasionScore) /
                      3
                    ).toFixed(1)}
                  </span>
                  <span className="text-sm text-vv-muted"> / 10 average</span>
                </div>

                {/* Flagged lines */}
                {critiqueReport.data.flaggedLines && critiqueReport.data.flaggedLines.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-vv-primary">Flagged Lines</h4>
                    <div className="space-y-2">
                      {critiqueReport.data.flaggedLines.map((flag, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-3"
                        >
                          <p className="text-xs font-mono text-amber-200/80 line-clamp-2">&ldquo;{flag.line}&rdquo;</p>
                          <p className="mt-1 text-xs text-red-300/80">⚠ {flag.issue}</p>
                          <p className="mt-1 text-xs text-emerald-300/80">✦ {flag.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overall feedback */}
                {critiqueReport.data.overallFeedback && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="mb-2 text-sm font-semibold text-vv-primary">Overall Feedback</h4>
                    <p className="text-sm leading-relaxed text-vv-secondary whitespace-pre-line">
                      {critiqueReport.data.overallFeedback}
                    </p>
                  </div>
                )}
              </div>
            </ReviewGate>
          )}
        </AiAgentCard>
      )}
    </div>
  );
}
