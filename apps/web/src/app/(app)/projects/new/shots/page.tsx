'use client';

import { useEffect, useCallback, useState } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { ShotPlan, ShotItem } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  shotPlan: ShotPlan & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

const CAMERA_ICONS: Record<string, string> = {
  'wide': '🖼',
  'medium': '📷',
  'close-up': '🔍',
  'extreme-close-up': '🔎',
  "bird's-eye": '🦅',
  'low-angle': '⬆️',
  'dutch-angle': '📐',
};

export default function ShotsPage() {
  const sceneBreakdown = useWizardStore((s) => s.sceneBreakdown);
  const contextBible = useWizardStore((s) => s.contextBible);
  const conceptVariations = useWizardStore((s) => s.conceptVariations);
  const shotPlan = useWizardStore((s) => s.shotPlan);
  const setShotPlan = useWizardStore((s) => s.setShotPlan);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);
  const [expandedShot, setExpandedShot] = useState<string | null>(null);

  const selectedConcept = conceptVariations.data?.directions.find((d) => d.selected);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/shots',
  });

  useEffect(() => {
    setCurrentPage(12);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      sceneBreakdown: sceneBreakdown.data,
      contextBible: contextBible.data,
      selectedConcept,
    });
    if (result?.success && result.shotPlan) {
      const { confidence: _c, assumptions: _a, ...data } = result.shotPlan;
      setShotPlan(data as ShotPlan, result.confidence, result.assumptions);
    }
  }, [agent, sceneBreakdown.data, contextBible.data, selectedConcept, setShotPlan]);

  useEffect(() => {
    if (shotPlan.status === 'empty' && sceneBreakdown.data) {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group shots by scene
  const shotsByScene = shotPlan.data?.shots.reduce<Record<string, ShotItem[]>>((acc, shot) => {
    (acc[shot.sceneId] ??= []).push(shot);
    return acc;
  }, {}) ?? {};

  const sceneIds = Object.keys(shotsByScene);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Shot <span className="gradient-text">Planning</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI generates detailed shot descriptions with prompts, camera angles, and motion.
        </p>
      </div>

      <AiAgentCard
        agentName="Shot Planner"
        description="Creates detailed shots with AI generation prompts for each scene"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
        loadingText="Planning shots…"
      >
        {shotPlan.data && (
          <ReviewGate
            document={shotPlan}
            title="Shot Plan"
            onApprove={() => updateDocumentStatus('shotPlan', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-vv-primary">{shotPlan.data.totalShots}</p>
                  <p className="text-[10px] text-vv-muted">Shots</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-lg font-bold text-vv-primary">{sceneIds.length}</p>
                  <p className="text-[10px] text-vv-muted">Scenes</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-lg font-bold text-vv-primary">{shotPlan.data.estimatedRenderTime}</p>
                  <p className="text-[10px] text-vv-muted">Est. Render</p>
                </div>
              </div>

              {/* Shots grouped by scene */}
              {sceneIds.map((sceneId, sceneIdx) => (
                <div key={sceneId}>
                  <h4
                    className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `hsl(${(sceneIdx * 35 + 180) % 360}, 70%, 65%)` }}
                  >
                    <span className="h-px flex-1" style={{ backgroundColor: `hsl(${(sceneIdx * 35 + 180) % 360}, 50%, 30%)` }} />
                    Scene {sceneIdx + 1} — {(shotsByScene[sceneId] ?? []).length} shots
                    <span className="h-px flex-1" style={{ backgroundColor: `hsl(${(sceneIdx * 35 + 180) % 360}, 50%, 30%)` }} />
                  </h4>
                  <div className="space-y-2">
                    {(shotsByScene[sceneId] ?? []).map((shot: ShotItem) => {
                      const isExpanded = expandedShot === shot.id;
                      return (
                        <button
                          key={shot.id}
                          onClick={() => setExpandedShot(isExpanded ? null : shot.id)}
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:bg-white/[0.04]"
                        >
                          {/* Shot header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{CAMERA_ICONS[shot.cameraAngle] || '📷'}</span>
                              <span className="text-sm font-semibold text-vv-primary">{shot.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-vv-muted">
                              <span className="vv-badge bg-white/5 text-[10px]">{shot.cameraAngle}</span>
                              <span className="vv-badge bg-white/5 text-[10px]">{shot.motion}</span>
                              <span>{shot.duration}s</span>
                              <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-emerald-300">AI Prompt</p>
                                <p className="mt-0.5 text-xs text-vv-secondary leading-relaxed font-mono bg-white/[0.02] p-2 rounded-lg">{shot.prompt}</p>
                              </div>
                              {shot.negativePrompt && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-red-300">Negative Prompt</p>
                                  <p className="mt-0.5 text-xs text-vv-muted font-mono bg-white/[0.02] p-2 rounded-lg">{shot.negativePrompt}</p>
                                </div>
                              )}
                              <div className="flex gap-4">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-vv-muted">Lighting</p>
                                  <p className="text-xs text-vv-secondary">{shot.lighting}</p>
                                </div>
                              </div>
                              {shot.continuityTags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {shot.continuityTags.map((tag) => (
                                    <span key={tag} className="vv-badge bg-violet-500/10 text-violet-300 text-[10px]">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
