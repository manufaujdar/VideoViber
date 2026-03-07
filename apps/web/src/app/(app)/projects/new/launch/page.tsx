'use client';

import { useEffect, useMemo } from 'react';
import { useWizardStore } from '@/features/wizard/wizard-store';
import { useWizardNav } from '@/features/wizard/hooks/use-wizard-nav';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(0).padStart(2, '0')}`;
}

export default function LaunchPage() {
  const setCurrentPage = useWizardStore((s) => s.setCurrentPage);
  const completeWizardAction = useWizardStore((s) => s.completeWizard);
  const { goToProject } = useWizardNav();

  const projectId = useWizardStore((s) => s.projectId);
  const projectCreation = useWizardStore((s) => s.projectCreation);
  const ideaIntake = useWizardStore((s) => s.ideaIntake);
  const strategyBrief = useWizardStore((s) => s.strategyBrief);
  const scriptDraft = useWizardStore((s) => s.scriptDraft);
  const sceneBreakdown = useWizardStore((s) => s.sceneBreakdown);
  const shotPlan = useWizardStore((s) => s.shotPlan);
  const audioPlan = useWizardStore((s) => s.audioPlan);
  const readinessReport = useWizardStore((s) => s.readinessReport);
  const completedPages = useWizardStore((s) => s.completedPages);
  const skippedPages = useWizardStore((s) => s.skippedPages);

  useEffect(() => {
    setCurrentPage(16);
  }, [setCurrentPage]);

  const pack = useMemo(() => {
    const items: Array<{ label: string; value: string; icon: string; status: 'done' | 'partial' | 'missing' }> = [
      {
        label: 'Project',
        value: projectCreation.name || 'Untitled',
        icon: '📁',
        status: projectId ? 'done' : 'missing',
      },
      {
        label: 'Platform',
        value: ideaIntake.targetPlatform || 'Not set',
        icon: '📱',
        status: ideaIntake.targetPlatform ? 'done' : 'partial',
      },
      {
        label: 'Strategy',
        value: strategyBrief.data ? 'Approved' : 'Not generated',
        icon: '🎯',
        status: strategyBrief.status === 'approved' ? 'done' : strategyBrief.data ? 'partial' : 'missing',
      },
      {
        label: 'Script',
        value: scriptDraft.data ? `${scriptDraft.data.fullScript.split(' ').length} words` : 'Not written',
        icon: '📝',
        status: scriptDraft.status === 'approved' ? 'done' : scriptDraft.data ? 'partial' : 'missing',
      },
      {
        label: 'Scenes',
        value: sceneBreakdown.data ? `${sceneBreakdown.data.sceneCount} scenes` : 'Not broken down',
        icon: '🎬',
        status: sceneBreakdown.status === 'approved' ? 'done' : sceneBreakdown.data ? 'partial' : 'missing',
      },
      {
        label: 'Shots',
        value: shotPlan.data ? `${shotPlan.data.totalShots} shots` : 'Not planned',
        icon: '📸',
        status: shotPlan.status === 'approved' ? 'done' : shotPlan.data ? 'partial' : 'missing',
      },
      {
        label: 'Audio',
        value: audioPlan.data ? `${audioPlan.data.tracks.length} tracks` : 'Not planned',
        icon: '🎵',
        status: audioPlan.status === 'approved' ? 'done' : audioPlan.data ? 'partial' : 'missing',
      },
      {
        label: 'Duration',
        value: sceneBreakdown.data ? formatTime(sceneBreakdown.data.totalDuration) : '--:--',
        icon: '⏱',
        status: sceneBreakdown.data ? 'done' : 'missing',
      },
      {
        label: 'QA',
        value: readinessReport.data ? readinessReport.data.overallStatus.replace('_', ' ') : 'Not run',
        icon: '✅',
        status: readinessReport.data?.overallStatus === 'ready' ? 'done' : readinessReport.data ? 'partial' : 'missing',
      },
    ];
    return items;
  }, [projectId, projectCreation, ideaIntake, strategyBrief, scriptDraft, sceneBreakdown, shotPlan, audioPlan, readinessReport]);

  const doneCount = pack.filter((p) => p.status === 'done').length;
  const completionPct = Math.round((doneCount / pack.length) * 100);

  const handleLaunch = () => {
    completeWizardAction();
    goToProject();
  };

  const STATUS_DOT: Record<string, string> = {
    done: 'bg-emerald-400',
    partial: 'bg-amber-400',
    missing: 'bg-red-400/50',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-vv-primary">
          Launch & <span className="gradient-text">Export</span>
        </h1>
        <p className="mt-1 text-sm text-vv-secondary">
          Final production pack summary. Review and import to project workspace.
        </p>
      </div>

      {/* Completion ring */}
      <div className="flex items-center gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-white/5"
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-emerald-400"
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${completionPct}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-vv-primary">
            {completionPct}%
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-vv-primary">Production Pack</h3>
          <p className="text-xs text-vv-muted">
            {doneCount}/{pack.length} modules complete • {completedPages.length} steps completed • {skippedPages.length} skipped
          </p>
        </div>
      </div>

      {/* Pack grid */}
      <div className="grid grid-cols-3 gap-2">
        {pack.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04]"
          >
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-vv-muted">{item.label}</p>
              <p className="text-xs font-medium text-vv-primary truncate">{item.value}</p>
            </div>
            <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[item.status]}`} />
          </div>
        ))}
      </div>

      {/* Launch CTA */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-cyan-500/[0.05] p-8 text-center">
        <span className="text-4xl">🚀</span>
        <h3 className="mt-2 text-xl font-bold text-emerald-200">Ready to Launch</h3>
        <p className="mt-1 text-sm text-vv-secondary max-w-md mx-auto">
          Your production plan is complete. Launch the project to import all scenes, shots, and audio into your workspace and begin AI generation.
        </p>

        {projectId ? (
          <button
            onClick={handleLaunch}
            className="vv-btn-primary mt-6 px-10 py-3 text-base font-semibold"
          >
            🚀 Launch Production
          </button>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-amber-300/80">⚠ No project created yet — go back to Step 5 to create one.</p>
          </div>
        )}

        <p className="mt-3 text-[10px] text-vv-muted">
          This will mark the wizard as complete and navigate to your project workspace.
        </p>
      </div>
    </div>
  );
}
