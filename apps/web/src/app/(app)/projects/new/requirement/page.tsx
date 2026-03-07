'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { RequirementReport } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  report: RequirementReport & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

const REPORT_SECTIONS: Array<{ key: keyof RequirementReport; label: string; icon: string }> = [
  { key: 'projectObjective', label: 'Project Objective', icon: '🎯' },
  { key: 'audienceUnderstanding', label: 'Audience Understanding', icon: '👥' },
  { key: 'contentFormat', label: 'Content Format', icon: '📐' },
  { key: 'recommendedDuration', label: 'Recommended Duration', icon: '⏱' },
  { key: 'visualStyleDirections', label: 'Visual Style Directions', icon: '🎨' },
  { key: 'scriptStructure', label: 'Script Structure', icon: '📝' },
  { key: 'assetRequirements', label: 'Asset Requirements', icon: '📦' },
  { key: 'missingInformation', label: 'Missing Information', icon: '❓' },
  { key: 'musicEffectDirection', label: 'Music & Effects Direction', icon: '🎵' },
  { key: 'productionRisks', label: 'Production Risks', icon: '⚠' },
  { key: 'platformRecommendations', label: 'Platform Recommendations', icon: '📱' },
  { key: 'suggestedWorkflow', label: 'Suggested Workflow', icon: '🔄' },
];

export default function RequirementPage() {
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const requirementReport = useWizardStore((s) => s.requirementReport);
  const setRequirementReport = useWizardStore((s) => s.setRequirementReport);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<typeof ideaIntake, AgentResponse>({
    endpoint: '/api/agents/requirement',
  });

  useEffect(() => {
    setCurrentPage(2);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call(ideaIntake);
    if (result?.success && result.report) {
      const { confidence: _c, assumptions: _a, sections: _s, ...reportData } = result.report;
      setRequirementReport(
        { ...reportData, sections: [] } as RequirementReport,
        result.confidence,
        result.assumptions
      );
    }
  }, [agent, ideaIntake, setRequirementReport]);

  // Auto-run on first visit if no report exists
  useEffect(() => {
    if (requirementReport.status === 'empty' && ideaIntake.rawIdea.trim().length > 5) {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          AI Requirement <span className="gradient-text">Report</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          Review and approve the AI-generated project analysis before proceeding.
        </p>
      </div>

      {/* Idea summary card */}
      <div className="vv-card border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-vv-muted">Your Idea</h4>
            <p className="mt-1 text-sm text-vv-primary line-clamp-2">{ideaIntake.rawIdea || 'No idea provided'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ideaIntake.targetPlatform && <span className="vv-badge text-xs">{ideaIntake.targetPlatform}</span>}
              {ideaIntake.videoGoal && <span className="vv-badge text-xs">{ideaIntake.videoGoal}</span>}
              {ideaIntake.preferredStyle && <span className="vv-badge text-xs">{ideaIntake.preferredStyle}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Agent card */}
      <AiAgentCard
        agentName="Requirement Analyst"
        description="Converts your raw idea into a structured project requirement report"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
      >
        {requirementReport.data && (
          <ReviewGate
            document={requirementReport}
            title="Requirement Report"
            onApprove={() => updateDocumentStatus('requirementReport', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-3">
              {REPORT_SECTIONS.map(({ key, label, icon }) => {
                const value = requirementReport.data?.[key];
                if (!value || typeof value !== 'string') return null;

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

      {/* Pre-project approval rule */}
      <div className="vv-card border-amber-500/15 bg-amber-500/[0.03]">
        <div className="flex items-start gap-3">
          <span className="text-amber-400">⚡</span>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            <strong>Pre-Project Approval Rule:</strong> No project workspace will be created until you
            approve this requirement report. This ensures your project is built on a solid, reviewed
            foundation.
          </p>
        </div>
      </div>
    </div>
  );
}
