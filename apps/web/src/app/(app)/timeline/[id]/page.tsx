'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/app/store';
import { MotionImage } from '@/components/motion-image';
import { toast } from 'sonner';

export default function TimelineEditorPage({ params }: { params: { id: string } }) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));
  const updateProject = useAppStore((s) => s.updateProject);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [_history] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const completedShots = useMemo(
    () => project?.shots.filter((s) => s.status === 'completed') ?? [],
    [project]
  );
  const totalDuration = useMemo(
    () => completedShots.reduce((a, s) => a + s.duration, 0),
    [completedShots]
  );
  const selectedClip = useMemo(
    () => completedShots.find((s) => s.id === selectedClipId),
    [completedShots, selectedClipId]
  );
  const previewClip = selectedClip ?? completedShots[0] ?? null;

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) setHistoryIndex((i) => i - 1);
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < _history.length - 1) setHistoryIndex((i) => i + 1);
  }, [_history.length, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRedo, handleUndo]);

  // Playback preview ticker
  useEffect(() => {
    if (!isPlaying || totalDuration === 0) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return Math.min(t + 0.1, totalDuration);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const handleExport = useCallback(() => {
    if (!project) return;

    if (completedShots.length === 0) {
      toast.error('No completed clips available to export.');
      return;
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      projectId: project.id,
      projectTitle: project.title,
      totalDurationSeconds: totalDuration,
      clips: completedShots.map((shot, index) => ({
        order: index + 1,
        id: shot.id,
        title: shot.title,
        prompt: shot.prompt,
        provider: shot.provider,
        durationSeconds: shot.duration,
        thumbnailUrl: shot.thumbnailUrl,
        videoUrl: shot.videoUrl,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug =
      project.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'videoviber-project';

    link.href = objectUrl;
    link.download = `${slug}-rough-cut.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);

    updateProject(project.id, { status: 'exported' });
    toast.success('Export manifest downloaded.');
  }, [project, completedShots, totalDuration, updateProject]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  if (!project) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center py-32">
        <h2 className="mb-2 text-xl font-bold">Project not found</h2>
        <Link href="/dashboard" className="vv-btn-primary mt-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up flex h-[calc(100vh-3.5rem)] flex-col space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${params.id}`}
            className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{project.title} — Timeline</h1>
            <p className="text-vv-muted text-xs">
              {completedShots.length} clips · {formatTime(totalDuration)} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} className="vv-btn-ghost px-3" title="Undo (⌘Z)">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
          </button>
          <button onClick={handleRedo} className="vv-btn-ghost px-3" title="Redo (⌘⇧Z)">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
              />
            </svg>
          </button>
          <div className="mx-1 h-6 w-px bg-white/10" />
          <button onClick={handleExport} className="vv-btn-primary">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Main area: Preview + Inspector */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-4">
        {/* Preview */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <div className="vv-card from-vv-surface to-vv-base relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br">
            {previewClip?.thumbnailUrl ? (
              <MotionImage
                src={previewClip.thumbnailUrl}
                alt={previewClip.title}
                width={1280}
                height={720}
                unoptimized
                className="h-full w-full object-contain"
                motionPreset="pan"
                motionSpeed="slow"
              />
            ) : previewClip?.videoUrl ? (
              <video
                src={previewClip.videoUrl}
                className="h-full w-full object-contain"
                controls
                playsInline
                preload="metadata"
              />
            ) : previewClip ? (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.2),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.16),transparent_42%)] p-8 text-center">
                <div>
                  <div className="bg-accent/10 ring-accent/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1">
                    <svg
                      className="text-accent h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold">{previewClip.title}</p>
                  <p className="text-vv-muted mt-2 max-w-md text-xs leading-relaxed">
                    {previewClip.prompt}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <svg
                    className="text-vv-muted h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                </div>
                <p className="text-vv-muted text-sm font-medium">No clips to preview</p>
                <p className="text-vv-disabled mt-1 text-xs">
                  Generate shots in the project workspace first
                </p>
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
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="text-accent h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <h3 className="text-vv-secondary text-sm font-bold">Inspector</h3>
          </div>

          {selectedClip ? (
            <div className="space-y-3">
              {selectedClip.thumbnailUrl && (
                <MotionImage
                  src={selectedClip.thumbnailUrl}
                  alt={selectedClip.title}
                  width={640}
                  height={360}
                  unoptimized
                  className="aspect-video w-full rounded-lg object-cover"
                  motionPreset="drift"
                  motionSpeed="medium"
                />
              )}
              {!selectedClip.thumbnailUrl && selectedClip.videoUrl && (
                <video
                  src={selectedClip.videoUrl}
                  className="aspect-video w-full rounded-lg object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              )}
              <h4 className="text-sm font-semibold">{selectedClip.title}</h4>
              <p className="text-vv-muted text-xs">{selectedClip.prompt}</p>
              <div className="space-y-2 pt-2">
                {[
                  { label: 'Duration', value: `${selectedClip.duration}s` },
                  { label: 'Trim Start', value: '0:00' },
                  { label: 'Trim End', value: formatTime(selectedClip.duration) },
                  { label: 'Provider', value: selectedClip.provider },
                  { label: 'Status', value: selectedClip.status },
                ].map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span className="text-vv-muted">{field.label}</span>
                    <span className="font-mono text-xs capitalize">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-vv-muted text-sm">
              Select a clip on the timeline to inspect its properties
            </p>
          )}
        </div>
      </div>

      {/* Timeline Track */}
      <div className="shrink-0">
        <div className="vv-card">
          {/* Time ruler */}
          <div className="text-vv-muted mb-2 flex items-center justify-between font-mono text-xs">
            {Array.from({ length: 5 }, (_, i) => {
              const t = (totalDuration / 4) * i;
              return <span key={i}>{formatTime(t)}</span>;
            })}
          </div>

          {/* Playhead */}
          <div className="relative">
            {totalDuration > 0 && (
              <div
                className="bg-accent shadow-accent/50 absolute top-0 z-10 h-full w-0.5 shadow-sm transition-all"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="bg-accent shadow-accent/50 absolute -left-1.5 -top-1 h-3 w-3 rounded-full shadow-md" />
              </div>
            )}

            {/* Video Track */}
            <div className="mb-2">
              <div className="text-vv-muted/60 mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                  />
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
                        onClick={() =>
                          setSelectedClipId(shot.id === selectedClipId ? null : shot.id)
                        }
                        style={{ width: `${Math.max(widthPct, 8)}%`, minWidth: `${80 * zoom}px` }}
                        className={`flex h-14 items-center justify-center truncate rounded-md border px-2 text-xs font-medium transition-all ${
                          shot.id === selectedClipId
                            ? 'border-accent bg-accent/15 text-accent ring-accent/30 ring-1'
                            : 'border-success/20 bg-success/5 text-vv-secondary hover:bg-success/10 hover:border-success/40'
                        }`}
                      >
                        <span className="truncate">{shot.title}</span>
                        <span className="text-vv-muted ml-1 shrink-0 text-[10px]">
                          {shot.duration}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="border-vv-border bg-vv-base/30 flex h-14 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-vv-muted text-xs">No completed clips — generate shots first</p>
                </div>
              )}
            </div>

            {/* Audio Track */}
            <div>
              <div className="text-vv-muted/60 mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                  />
                </svg>
                Audio
              </div>
              <div className="border-vv-border/50 bg-vv-base/20 flex h-10 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-vv-disabled text-[10px]">Drop audio track here</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentTime(0)}
                className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062a1.125 1.125 0 011.683.977v8.123z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="bg-accent/10 text-accent hover:bg-accent/20 flex h-9 w-9 items-center justify-center rounded-lg transition-all"
              >
                {isPlaying ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setCurrentTime(totalDuration)}
                className="text-vv-muted hover:text-vv-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.03]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z"
                  />
                </svg>
              </button>
              <div className="text-vv-muted ml-3 font-mono text-xs">{formatTime(currentTime)}</div>
            </div>
            <div className="flex items-center gap-3">
              {/* Zoom */}
              <div className="flex items-center gap-2">
                <span className="text-vv-muted text-[10px]">Zoom</span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="accent-accent w-20"
                />
              </div>
              <div className="text-vv-muted text-xs">{completedShots.length} clips</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
