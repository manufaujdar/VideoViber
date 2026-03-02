'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/app/store';
import { toast } from 'sonner';

export default function TimelineEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));
  const updateProject = useAppStore((s) => s.updateProject);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const completedShots = project?.shots.filter((s) => s.status === 'completed') ?? [];
  const totalDuration = completedShots.reduce((a, s) => a + s.duration, 0);
  const selectedClip = completedShots.find((s) => s.id === selectedClipId);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying((p) => !p); }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [historyIndex]);

  // Playback simulation
  useEffect(() => {
    if (!isPlaying || totalDuration === 0) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= totalDuration) { setIsPlaying(false); return 0; }
        return Math.min(t + 0.1, totalDuration);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex((i) => i - 1);
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex((i) => i + 1);
  };

  const handleExport = useCallback(async () => {
    if (!project) return;
    toast.loading('Exporting rough cut...', { id: 'export' });
    await new Promise((r) => setTimeout(r, 2500));
    updateProject(project.id, { status: 'exported' });
    toast.success('Rough cut exported successfully!', { id: 'export' });
  }, [project, updateProject]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in-up">
        <h2 className="text-xl font-bold mb-2">Project not found</h2>
        <Link href="/dashboard" className="vv-btn-primary mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col space-y-3 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${params.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-vv-muted transition-colors hover:bg-white/[0.03] hover:text-vv-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{project.title} — Timeline</h1>
            <p className="text-xs text-vv-muted">{completedShots.length} clips · {formatTime(totalDuration)} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} className="vv-btn-ghost px-3" title="Undo (⌘Z)">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
          <button onClick={handleRedo} className="vv-btn-ghost px-3" title="Redo (⌘⇧Z)">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
            </svg>
          </button>
          <div className="mx-1 h-6 w-px bg-white/10" />
          <button onClick={handleExport} className="vv-btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Main area: Preview + Inspector */}
      <div className="grid flex-1 gap-3 lg:grid-cols-4 min-h-0">
        {/* Preview */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="vv-card flex-1 flex items-center justify-center bg-gradient-to-br from-vv-surface to-vv-base overflow-hidden relative">
            {selectedClip?.thumbnailUrl ? (
              <img src={selectedClip.thumbnailUrl} alt={selectedClip.title} className="h-full w-full object-contain" />
            ) : completedShots[0]?.thumbnailUrl ? (
              <img src={completedShots[0].thumbnailUrl} alt="Preview" className="h-full w-full object-contain opacity-50" />
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <svg className="h-7 w-7 text-vv-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-vv-muted">No clips to preview</p>
                <p className="mt-1 text-xs text-vv-disabled">Generate shots in the project workspace first</p>
              </div>
            )}
            {/* Time overlay */}
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 font-mono text-xs text-white backdrop-blur-sm">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
          </div>
        </div>

        {/* Clip Inspector */}
        <div className="vv-card overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <h3 className="text-sm font-bold text-vv-secondary">Inspector</h3>
          </div>

          {selectedClip ? (
            <div className="space-y-3">
              {selectedClip.thumbnailUrl && (
                <img src={selectedClip.thumbnailUrl} alt={selectedClip.title} className="w-full aspect-video object-cover rounded-lg" />
              )}
              <h4 className="font-semibold text-sm">{selectedClip.title}</h4>
              <p className="text-xs text-vv-muted">{selectedClip.prompt}</p>
              <div className="space-y-2 pt-2">
                {[
                  { label: 'Duration', value: `${selectedClip.duration}s` },
                  { label: 'Trim Start', value: '0:00' },
                  { label: 'Trim End', value: formatTime(selectedClip.duration) },
                  { label: 'Provider', value: selectedClip.provider },
                  { label: 'Status', value: selectedClip.status },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="text-vv-muted">{field.label}</span>
                    <span className="font-mono text-xs capitalize">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-vv-muted">Select a clip on the timeline to inspect its properties</p>
          )}
        </div>
      </div>

      {/* Timeline Track */}
      <div className="shrink-0">
        <div className="vv-card">
          {/* Time ruler */}
          <div className="mb-2 flex items-center justify-between text-xs text-vv-muted font-mono">
            {Array.from({ length: 5 }, (_, i) => {
              const t = (totalDuration / 4) * i;
              return <span key={i}>{formatTime(t)}</span>;
            })}
          </div>

          {/* Playhead */}
          <div className="relative">
            {totalDuration > 0 && (
              <div
                className="absolute top-0 z-10 h-full w-0.5 bg-accent shadow-sm shadow-accent/50 transition-all"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="absolute -top-1 -left-1.5 h-3 w-3 rounded-full bg-accent shadow-md shadow-accent/50" />
              </div>
            )}

            {/* Video Track */}
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-vv-muted/60">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Video
              </div>
              {completedShots.length > 0 ? (
                <div className="flex gap-0.5 overflow-x-auto">
                  {completedShots.map((shot) => {
                    const widthPct = totalDuration > 0 ? (shot.duration / totalDuration) * 100 : 0;
                    return (
                      <button
                        key={shot.id}
                        onClick={() => setSelectedClipId(shot.id === selectedClipId ? null : shot.id)}
                        style={{ width: `${Math.max(widthPct, 8)}%`, minWidth: `${80 * zoom}px` }}
                        className={`flex h-14 items-center justify-center rounded-md border px-2 transition-all text-xs font-medium truncate ${
                          shot.id === selectedClipId
                            ? 'border-accent bg-accent/15 text-accent ring-1 ring-accent/30'
                            : 'border-success/20 bg-success/5 text-vv-secondary hover:bg-success/10 hover:border-success/40'
                        }`}
                      >
                        <span className="truncate">{shot.title}</span>
                        <span className="ml-1 text-[10px] text-vv-muted shrink-0">{shot.duration}s</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-14 items-center justify-center rounded-lg border-2 border-dashed border-vv-border bg-vv-base/30">
                  <p className="text-xs text-vv-muted">No completed clips — generate shots first</p>
                </div>
              )}
            </div>

            {/* Audio Track */}
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-vv-muted/60">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                Audio
              </div>
              <div className="flex h-10 items-center justify-center rounded-lg border-2 border-dashed border-vv-border/50 bg-vv-base/20">
                <p className="text-[10px] text-vv-disabled">Drop audio track here</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentTime(0)} className="flex h-8 w-8 items-center justify-center rounded-lg text-vv-muted transition-colors hover:bg-white/[0.03] hover:text-vv-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062a1.125 1.125 0 011.683.977v8.123z" />
                </svg>
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent transition-all hover:bg-accent/20"
              >
                {isPlaying ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                )}
              </button>
              <button onClick={() => setCurrentTime(totalDuration)} className="flex h-8 w-8 items-center justify-center rounded-lg text-vv-muted transition-colors hover:bg-white/[0.03] hover:text-vv-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                </svg>
              </button>
              <div className="ml-3 font-mono text-xs text-vv-muted">
                {formatTime(currentTime)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Zoom */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-vv-muted">Zoom</span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-20 accent-accent"
                />
              </div>
              <div className="text-xs text-vv-muted">{completedShots.length} clips</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
