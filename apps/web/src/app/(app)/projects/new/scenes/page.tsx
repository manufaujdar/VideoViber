'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { SceneBreakdown, SceneItem } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  sceneBreakdown: SceneBreakdown & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toFixed(0)}s`;
}

const TRANSITION_ICONS: Record<string, string> = {
  cut: '✂️',
  dissolve: '🌊',
  fade: '🌑',
  wipe: '🔀',
  none: '⬜',
};

export default function ScenesPage() {
  const scriptDraft = useWizardStore((s) => s.scriptDraft);
  const contextBible = useWizardStore((s) => s.contextBible);
  const strategyBrief = useWizardStore((s) => s.strategyBrief);
  const sceneBreakdown = useWizardStore((s) => s.sceneBreakdown);
  const setSceneBreakdown = useWizardStore((s) => s.setSceneBreakdown);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/scenes',
  });

  useEffect(() => {
    setCurrentPage(11);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      scriptDraft: scriptDraft.data,
      contextBible: contextBible.data,
      strategyBrief: strategyBrief.data,
    });
    if (result?.success && result.sceneBreakdown) {
      const { confidence: _c, assumptions: _a, ...data } = result.sceneBreakdown;
      setSceneBreakdown(data as SceneBreakdown, result.confidence, result.assumptions);
    }
  }, [agent, scriptDraft.data, contextBible.data, strategyBrief.data, setSceneBreakdown]);

  useEffect(() => {
    if (sceneBreakdown.status === 'empty' && scriptDraft.data) {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Scene <span className="gradient-text">Breakdown</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI segments the script into production-ready scenes.
        </p>
      </div>

      <AiAgentCard
        agentName="Scene Architect"
        description="Breaks the approved script into discrete, filmable scenes"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
        loadingText="Breaking down scenes…"
      >
        {sceneBreakdown.data && (
          <ReviewGate
            document={sceneBreakdown}
            title="Scene Breakdown"
            onApprove={() => updateDocumentStatus('sceneBreakdown', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-vv-primary">{sceneBreakdown.data.sceneCount}</p>
                  <p className="text-[10px] text-vv-muted">Scenes</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-lg font-bold text-vv-primary">{formatDuration(sceneBreakdown.data.totalDuration)}</p>
                  <p className="text-[10px] text-vv-muted">Total</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-lg font-bold text-vv-primary">
                    {sceneBreakdown.data.sceneCount > 0
                      ? (sceneBreakdown.data.totalDuration / sceneBreakdown.data.sceneCount).toFixed(1)
                      : '0'}s
                  </p>
                  <p className="text-[10px] text-vv-muted">Avg/Scene</p>
                </div>
              </div>

              {/* Timeline bar */}
              <div className="flex h-6 gap-0.5 rounded-lg overflow-hidden">
                {sceneBreakdown.data.scenes.map((scene, i) => {
                  const pct = (scene.duration / sceneBreakdown.data!.totalDuration) * 100;
                  const hue = (i * 35 + 180) % 360;
                  return (
                    <div
                      key={scene.id}
                      className="flex items-center justify-center text-[9px] font-bold text-white/80 transition-all hover:brightness-125"
                      style={{ width: `${pct}%`, backgroundColor: `hsl(${hue}, 60%, 35%)` }}
                      title={`${scene.title} — ${scene.duration}s`}
                    >
                      {pct > 8 ? (i + 1) : ''}
                    </div>
                  );
                })}
              </div>

              {/* Scene cards */}
              <div className="space-y-3">
                {sceneBreakdown.data.scenes.map((scene: SceneItem, i: number) => (
                  <div
                    key={scene.id}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                          style={{ backgroundColor: `hsl(${(i * 35 + 180) % 360}, 60%, 25%)`, color: `hsl(${(i * 35 + 180) % 360}, 80%, 75%)` }}
                        >
                          {i + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-vv-primary">{scene.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-vv-muted">
                        <span>{scene.duration}s</span>
                        <span title={`Transition: ${scene.transition}`}>
                          {TRANSITION_ICONS[scene.transition] || '✂️'}
                        </span>
                      </div>
                    </div>
                    <p className="mb-2 text-xs text-vv-muted">{scene.purpose}</p>
                    <p className="text-sm text-vv-secondary leading-relaxed">{scene.visualDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
