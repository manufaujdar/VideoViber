'use client';

import { useEffect, useCallback } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useAgent } from '@/features/wizard/hooks/use-agent';
import { AiAgentCard } from '@/features/wizard/components/ai-agent-card';
import { ReviewGate } from '@/features/wizard/components/review-gate';
import type { AudioPlan, AudioTrack } from '@/features/wizard/wizard-types';

interface AgentResponse {
  success: boolean;
  audioPlan: AudioPlan & { confidence?: number; assumptions?: string[] };
  confidence: number;
  assumptions: string[];
}

const TYPE_CONFIG: Record<AudioTrack['type'], { icon: string; color: string; bg: string }> = {
  music: { icon: '🎵', color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
  sfx: { icon: '💥', color: 'text-amber-300', bg: 'bg-amber-500/10' },
  voiceover: { icon: '🎙', color: 'text-violet-300', bg: 'bg-violet-500/10' },
  ambient: { icon: '🌿', color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
};

export default function AudioPage() {
  const sceneBreakdown = useWizardStore((s) => s.sceneBreakdown);
  const scriptDraft = useWizardStore((s) => s.scriptDraft);
  const contextBible = useWizardStore((s) => s.contextBible);
  const audioPlan = useWizardStore((s) => s.audioPlan);
  const setAudioPlan = useWizardStore((s) => s.setAudioPlan);
  const updateDocumentStatus = useWizardStore((s) => s.updateDocumentStatus);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);

  const agent = useAgent<Record<string, unknown>, AgentResponse>({
    endpoint: '/api/agents/audio',
  });

  useEffect(() => {
    setCurrentPage(13);
  }, [setCurrentPage]);

  const runAgent = useCallback(async () => {
    const result = await agent.call({
      sceneBreakdown: sceneBreakdown.data,
      scriptDraft: scriptDraft.data,
      contextBible: contextBible.data,
    });
    if (result?.success && result.audioPlan) {
      const { confidence: _c, assumptions: _a, ...data } = result.audioPlan;
      setAudioPlan(data as AudioPlan, result.confidence, result.assumptions);
    }
  }, [agent, sceneBreakdown.data, scriptDraft.data, contextBible.data, setAudioPlan]);

  useEffect(() => {
    if (audioPlan.status === 'empty' && sceneBreakdown.data) {
      runAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group tracks by type
  const groupedTracks = audioPlan.data?.tracks.reduce<Record<string, AudioTrack[]>>((acc, t) => {
    (acc[t.type] ??= []).push(t);
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Audio & <span className="gradient-text">Effects</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          AI plans all audio layers: music, SFX, voiceover, and ambient sounds.
        </p>
      </div>

      <AiAgentCard
        agentName="Audio Director"
        description="Plans music, sound effects, voiceover, and ambient audio"
        loading={agent.loading}
        error={agent.error}
        onTrigger={runAgent}
        loadingText="Planning audio…"
      >
        {audioPlan.data && (
          <ReviewGate
            document={audioPlan}
            title="Audio Plan"
            onApprove={() => updateDocumentStatus('audioPlan', 'approved')}
            onRegenerate={runAgent}
            regenerating={agent.loading}
          >
            <div className="space-y-5">
              {/* Music mood */}
              {audioPlan.data.musicMood && (
                <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] p-4">
                  <h4 className="mb-1 text-sm font-semibold text-cyan-200">🎶 Music Mood</h4>
                  <p className="text-sm text-vv-secondary">{audioPlan.data.musicMood}</p>
                </div>
              )}

              {/* Track groups */}
              {(['music', 'voiceover', 'sfx', 'ambient'] as const).map((type) => {
                const tracks = groupedTracks[type];
                if (!tracks || tracks.length === 0) return null;
                const cfg = TYPE_CONFIG[type];

                return (
                  <div key={type}>
                    <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                      {cfg.icon} {type} ({tracks.length})
                    </h4>
                    <div className="space-y-2">
                      {tracks.map((track) => (
                        <div
                          key={track.id}
                          className={`rounded-xl border border-white/[0.06] ${cfg.bg} p-3`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-vv-primary">{track.label}</span>
                            <div className="flex items-center gap-2 text-xs text-vv-muted">
                              <span>{track.startTime}s → {(track.startTime + track.duration).toFixed(1)}s</span>
                              <span className="vv-badge bg-white/5 text-[10px]">Vol: {Math.round(track.volume * 100)}%</span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-vv-secondary">{track.description}</p>
                          {track.source && (
                            <p className="mt-1 text-xs text-vv-muted italic">{track.source}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Voiceover script */}
              {audioPlan.data.voiceoverScript && (
                <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-4">
                  <h4 className="mb-2 text-sm font-semibold text-violet-200">🎙 Voiceover Script</h4>
                  <p className="text-sm text-vv-secondary whitespace-pre-line leading-relaxed font-mono">
                    {audioPlan.data.voiceoverScript}
                  </p>
                </div>
              )}

              {/* Overall notes */}
              {audioPlan.data.overallNotes && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h4 className="mb-1 text-sm font-semibold text-vv-primary">📝 Mixing Notes</h4>
                  <p className="text-sm text-vv-secondary">{audioPlan.data.overallNotes}</p>
                </div>
              )}
            </div>
          </ReviewGate>
        )}
      </AiAgentCard>
    </div>
  );
}
