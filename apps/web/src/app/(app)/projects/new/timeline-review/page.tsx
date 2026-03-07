'use client';

import { useEffect, useMemo } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useWizardNav } from '@/features/wizard/hooks/use-wizard-nav';
import type { TimelineEntry } from '@/features/wizard/wizard-types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

const LANE_COLORS: Record<TimelineEntry['type'], { bg: string; border: string; text: string }> = {
  scene: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-300' },
  shot: { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-300' },
  audio: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-300' },
  transition: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300' },
};

export default function TimelineReviewPage() {
  const sceneBreakdown = useWizardStore((s) => s.sceneBreakdown);
  const shotPlan = useWizardStore((s) => s.shotPlan);
  const audioPlan = useWizardStore((s) => s.audioPlan);
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);
  const { goToProject } = useWizardNav();
  const projectId = useWizardStore((s) => s.projectId);

  useEffect(() => {
    setCurrentPage(14);
  }, [setCurrentPage]);

  // Build timeline entries from scenes, shots, and audio
  const { entries, totalDuration, warnings } = useMemo(() => {
    const items: TimelineEntry[] = [];
    const warns: string[] = [];
    let maxTime = 0;

    // Scenes
    if (sceneBreakdown.data) {
      let t = 0;
      sceneBreakdown.data.scenes.forEach((s) => {
        items.push({
          id: `tl-scene-${s.id}`,
          type: 'scene',
          label: s.title,
          startTime: t,
          duration: s.duration,
          sceneId: s.id,
          details: s.visualDescription,
        });
        t += s.duration;
      });
      maxTime = Math.max(maxTime, t);
    }

    // Shots
    if (shotPlan.data && sceneBreakdown.data) {
      sceneBreakdown.data.scenes.forEach((scene) => {
        const sceneShots = shotPlan.data!.shots.filter((sh) => sh.sceneId === scene.id);
        // Find scene start
        const sceneEntry = items.find((e) => e.sceneId === scene.id && e.type === 'scene');
        let t = sceneEntry?.startTime ?? 0;
        sceneShots.forEach((sh) => {
          items.push({
            id: `tl-shot-${sh.id}`,
            type: 'shot',
            label: sh.title,
            startTime: t,
            duration: sh.duration,
            sceneId: scene.id,
            shotId: sh.id,
            details: `${sh.cameraAngle} | ${sh.motion}`,
          });
          t += sh.duration;
        });
      });
    }

    // Audio
    if (audioPlan.data) {
      audioPlan.data.tracks.forEach((track) => {
        items.push({
          id: `tl-audio-${track.id}`,
          type: 'audio',
          label: `${track.type}: ${track.label}`,
          startTime: track.startTime,
          duration: track.duration,
          sceneId: track.sceneId,
          details: track.description,
        });
        maxTime = Math.max(maxTime, track.startTime + track.duration);
      });
    }

    // Validation
    if (!sceneBreakdown.data) warns.push('No scene breakdown data — scenes are missing.');
    if (!shotPlan.data) warns.push('No shot plan — shots are missing.');
    if (!audioPlan.data) warns.push('No audio plan — audio tracks are missing.');
    if (sceneBreakdown.data && shotPlan.data) {
      const sceneDur = sceneBreakdown.data.totalDuration;
      const shotDur = shotPlan.data.shots.reduce((a, s) => a + s.duration, 0);
      if (Math.abs(sceneDur - shotDur) > 2) {
        warns.push(`Shot durations (${shotDur.toFixed(1)}s) differ from scene total (${sceneDur.toFixed(1)}s) by >${Math.abs(sceneDur - shotDur).toFixed(1)}s.`);
      }
    }

    return { entries: items.sort((a, b) => a.startTime - b.startTime), totalDuration: maxTime, warnings: warns };
  }, [sceneBreakdown.data, shotPlan.data, audioPlan.data]);

  // Group by type for lane view
  const lanes = ([
    { type: 'scene' as const, label: '🎬 Scenes', items: entries.filter((e) => e.type === 'scene') },
    { type: 'shot' as const, label: '📸 Shots', items: entries.filter((e) => e.type === 'shot') },
    { type: 'audio' as const, label: '🎵 Audio', items: entries.filter((e) => e.type === 'audio') },
  ]).filter((l) => l.items.length > 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Timeline <span className="gradient-text">Review</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          Review the assembled timeline before production begins.
        </p>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="text-center">
          <p className="text-lg font-bold text-vv-primary">{formatTime(totalDuration)}</p>
          <p className="text-[10px] text-vv-muted">Duration</p>
        </div>
        <div className="h-8 w-px bg-white/[0.06]" />
        <div className="text-center">
          <p className="text-lg font-bold text-vv-primary">{entries.filter((e) => e.type === 'scene').length}</p>
          <p className="text-[10px] text-vv-muted">Scenes</p>
        </div>
        <div className="h-8 w-px bg-white/[0.06]" />
        <div className="text-center">
          <p className="text-lg font-bold text-vv-primary">{entries.filter((e) => e.type === 'shot').length}</p>
          <p className="text-[10px] text-vv-muted">Shots</p>
        </div>
        <div className="h-8 w-px bg-white/[0.06]" />
        <div className="text-center">
          <p className="text-lg font-bold text-vv-primary">{entries.filter((e) => e.type === 'audio').length}</p>
          <p className="text-[10px] text-vv-muted">Audio</p>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 space-y-1">
          <h4 className="text-sm font-semibold text-amber-200">⚠ Warnings</h4>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-300/80">• {w}</p>
          ))}
        </div>
      )}

      {/* Lane view */}
      {totalDuration > 0 && (
        <div className="space-y-3 overflow-x-auto scrollbar-hide">
          {/* Time ruler */}
          <div className="relative h-6 rounded-lg bg-white/[0.02] min-w-[600px]">
            {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => {
              const pct = (i / totalDuration) * 100;
              if (pct > 100) return null;
              return (
                <span
                  key={i}
                  className="absolute text-[9px] text-vv-muted"
                  style={{ left: `${pct}%`, top: '2px' }}
                >
                  {i}s
                </span>
              );
            })}
          </div>

          {/* Lanes */}
          {lanes.map((lane) => (
            <div key={lane.type} className="min-w-[600px]">
              <p className="mb-1 text-[10px] font-semibold text-vv-muted">{lane.label}</p>
              <div className="relative h-10 rounded-lg bg-white/[0.02]">
                {lane.items.map((entry) => {
                  const left = (entry.startTime / totalDuration) * 100;
                  const width = (entry.duration / totalDuration) * 100;
                  const cfg = LANE_COLORS[entry.type];
                  return (
                    <div
                      key={entry.id}
                      className={`absolute top-1 bottom-1 rounded-md border ${cfg.border} ${cfg.bg} flex items-center px-1.5 overflow-hidden transition-all hover:brightness-125`}
                      style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                      title={`${entry.label} (${entry.duration}s)\n${entry.details}`}
                    >
                      <span className={`text-[9px] font-medium truncate ${cfg.text}`}>
                        {entry.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entry list */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-vv-primary">Full Timeline ({entries.length} entries)</h3>
        <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-hide">
          {entries.map((entry) => {
            const cfg = LANE_COLORS[entry.type];
            return (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2 text-xs">
                <span className={`vv-badge ${cfg.bg} ${cfg.text} text-[10px] w-14 text-center`}>{entry.type}</span>
                <span className="text-vv-muted w-20">{formatTime(entry.startTime)} — {formatTime(entry.startTime + entry.duration)}</span>
                <span className="flex-1 text-vv-primary truncate">{entry.label}</span>
                <span className="text-vv-muted">{entry.duration}s</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Go to project CTA (only if project exists) */}
      {projectId && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 text-center">
          <h3 className="text-lg font-bold text-emerald-200">🎬 Production Ready</h3>
          <p className="mt-1 text-sm text-vv-secondary">
            Timeline reviewed. You can now launch production in your project workspace.
          </p>
          <button
            onClick={goToProject}
            className="vv-btn-primary mt-4 px-8 py-2.5"
          >
            Go to Project →
          </button>
        </div>
      )}
    </div>
  );
}
