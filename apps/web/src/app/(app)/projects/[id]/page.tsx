'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useAppStore, simulateGeneration } from '@/app/store';
import { toast } from 'sonner';

export default function ProjectWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));
  const updateShot = useAppStore((s) => s.updateShot);
  const addGeneration = useAppStore((s) => s.addGeneration);
  const updateProject = useAppStore((s) => s.updateProject);

  const handleGenerateShot = useCallback(
    async (shotId: string) => {
      if (!project) return;
      const shot = project.shots.find((s) => s.id === shotId);
      if (!shot) return;

      const genId = addGeneration({
        projectId: project.id,
        projectTitle: project.title,
        shotId: shot.id,
        shotTitle: shot.title,
        provider: shot.provider,
        status: 'queued',
        progress: 0,
      });

      toast.loading(`Generating "${shot.title}"...`, { id: genId });
      const store = useAppStore.getState();
      await simulateGeneration(store, project.id, shotId, genId);

      const updated = useAppStore.getState().generations.find((g) => g.id === genId);
      if (updated?.status === 'completed') {
        toast.success(`"${shot.title}" generated!`, { id: genId });
      } else {
        toast.error(`"${shot.title}" failed`, { id: genId });
      }
    },
    [project, addGeneration]
  );

  const handleGenerateAll = useCallback(async () => {
    if (!project) return;
    const pending = project.shots.filter((s) => s.status === 'draft' || s.status === 'failed');
    if (pending.length === 0) {
      toast.info('All shots are already generated');
      return;
    }
    updateProject(project.id, { status: 'generating' });
    toast.loading(`Generating ${pending.length} shots...`, { id: 'batch' });

    for (const shot of pending) {
      await handleGenerateShot(shot.id);
    }

    toast.success('Batch generation complete!', { id: 'batch' });
  }, [project, handleGenerateShot, updateProject]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in-up">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Project not found</h2>
        <p className="text-sm text-vv-secondary mb-6">This project doesn&apos;t exist or has been deleted.</p>
        <Link href="/dashboard" className="vv-btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const completedShots = project.shots.filter((s) => s.status === 'completed').length;
  const totalShots = project.shots.length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-vv-muted">
            <Link href="/dashboard" className="hover:text-vv-secondary transition-colors">Dashboard</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span>Project</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{project.title}</h1>
          <p className="mt-1 text-sm text-vv-secondary line-clamp-1">{project.brief}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-vv-muted">{completedShots}/{totalShots} shots ready</span>
          <button onClick={handleGenerateAll} className="vv-btn-secondary w-full sm:w-auto">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
            </svg>
            Generate All
          </button>
          <Link href={`/timeline/${params.id}`} className="vv-btn-primary w-full sm:w-auto">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            Open Timeline
          </Link>
        </div>
      </div>

      {/* Shot Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.375" />
          </svg>
          <h2 className="text-lg font-bold">Shots ({totalShots})</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.shots.map((shot) => (
            <div key={shot.id} className="vv-card-hover group relative overflow-hidden">
              {/* Thumbnail */}
              <div className="relative aspect-video mb-4 overflow-hidden rounded-lg bg-vv-base">
                {shot.thumbnailUrl ? (
                  <img src={shot.thumbnailUrl} alt={shot.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-8 w-8 text-vv-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span className={`vv-badge text-xs ${
                    shot.status === 'completed' ? 'bg-success/20 text-success' :
                    shot.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                    shot.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    shot.status === 'queued' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-white/10 text-vv-muted'
                  }`}>
                    {shot.status === 'processing' && (
                      <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {shot.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{shot.title}</h3>
                  <span className="text-xs text-vv-muted">{shot.duration}s</span>
                </div>
                <p className="text-xs text-vv-muted line-clamp-2">{shot.prompt}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-vv-disabled capitalize">{shot.provider}</span>
                  {(shot.status === 'draft' || shot.status === 'failed') && (
                    <button
                      onClick={() => handleGenerateShot(shot.id)}
                      className="vv-btn-primary px-3 py-1.5 text-xs"
                    >
                      {shot.status === 'failed' ? 'Retry' : 'Generate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            <h2 className="text-lg font-bold">Timeline</h2>
          </div>
          <Link href={`/timeline/${params.id}`} className="vv-btn-ghost text-sm">
            Open Full Editor
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
        <div className="vv-card overflow-hidden">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {project.shots.map((shot) => (
              <div
                key={shot.id}
                className={`flex h-16 min-w-[120px] flex-shrink-0 items-center justify-center rounded-lg border transition-all ${
                  shot.status === 'completed'
                    ? 'border-success/30 bg-success/5'
                    : shot.status === 'processing'
                    ? 'border-blue-500/30 bg-blue-500/5 animate-pulse'
                    : 'border-vv-border bg-vv-base/50'
                }`}
              >
                <div className="text-center px-2">
                  <p className="text-xs font-medium truncate max-w-[100px]">{shot.title}</p>
                  <p className="text-[10px] text-vv-muted">{shot.duration}s</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-vv-muted text-right">
            {completedShots} of {totalShots} clips ready · {project.shots.reduce((a, s) => a + s.duration, 0)}s total
          </div>
        </div>
      </div>
    </div>
  );
}
