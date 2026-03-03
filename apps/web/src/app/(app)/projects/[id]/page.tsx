'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { parsePlannerShots } from '@/lib/shot-planner';
import { useAppStore } from '@/app/store';
import { MotionImage } from '@/components/motion-image';
import { toast } from 'sonner';

async function readResponsePayload(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

const MIN_IMPORT_DURATION = 0.5;
const MAX_IMPORT_DURATION = 60 * 60 * 6; // 6 hours

function toImportedTitle(fileName: string) {
  return fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || 'Imported Clip';
}

function readVideoMetadata(url: string): Promise<{ duration: number; width?: number; height?: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const rawDuration = Number.isFinite(video.duration) ? video.duration : 6;
      resolve({
        duration: Math.min(MAX_IMPORT_DURATION, Math.max(MIN_IMPORT_DURATION, rawDuration)),
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
    };
    video.onerror = () => reject(new Error('Unable to read video metadata'));
    video.src = url;
  });
}

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === params.id));

  const addShot = useAppStore((s) => s.addShot);
  const addAsset = useAppStore((s) => s.addAsset);
  const addGeneration = useAppStore((s) => s.addGeneration);
  const updateGeneration = useAppStore((s) => s.updateGeneration);
  const updateProject = useAppStore((s) => s.updateProject);
  const updateShot = useAppStore((s) => s.updateShot);
  const [importingMedia, setImportingMedia] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

      updateShot(project.id, shot.id, { status: 'processing' });
      updateGeneration(genId, { status: 'processing', progress: 20, error: null });
      toast.loading(`Generating "${shot.title}"...`, { id: genId });

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: shot.prompt,
            provider: shot.provider,
            workflow: 'video',
            waitForCompletion: false,
            duration: shot.duration,
            aspectRatio: '16:9',
            shotCount: 1,
          }),
        });

        const payload = await readResponsePayload(response);
        if (!response.ok) {
          throw new Error(
            payload?.error ||
              payload?.details ||
              (typeof payload?.raw === 'string' ? payload.raw.slice(0, 220) : undefined) ||
              `Request failed (${response.status})`
          );
        }

        let finalPayload = payload;
        const operationName =
          payload?.result?.operationName ??
          payload?.operationName ??
          payload?.result?.name ??
          payload?.name;

        if (
          operationName &&
          (payload?.status === 'processing' || payload?.result?.status === 'processing')
        ) {
          for (let attempt = 1; attempt <= 20; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 3000));

            updateGeneration(genId, {
              status: 'processing',
              progress: Math.min(95, 20 + attempt * 3),
              error: null,
            });

            const statusResponse = await fetch(
              `/api/generate?operationName=${encodeURIComponent(operationName)}`
            );
            const statusPayload = await readResponsePayload(statusResponse);

            if (!statusResponse.ok && statusPayload?.status !== 'processing') {
              throw new Error(
                statusPayload?.details ||
                  statusPayload?.error ||
                  `Operation polling failed (${statusResponse.status})`
              );
            }

            if (
              statusPayload?.status === 'completed' ||
              statusPayload?.result?.status === 'completed'
            ) {
              finalPayload = statusPayload;
              break;
            }

            if (
              statusPayload?.status === 'failed' ||
              statusPayload?.result?.status === 'failed'
            ) {
              throw new Error(
                statusPayload?.details || statusPayload?.error || 'Video generation failed'
              );
            }

            if (attempt === 20) {
              throw new Error(
                'Video generation is still processing. Retry in a moment to fetch the result.'
              );
            }
          }
        }

        const videoUrl =
          finalPayload?.result?.video?.proxyUrl ||
          finalPayload?.result?.video?.uri ||
          finalPayload?.video?.proxyUrl ||
          finalPayload?.video?.uri ||
          null;
        const planned = parsePlannerShots(finalPayload?.result?.content ?? '', 1)[0];

        if (!videoUrl && !planned) {
          throw new Error('Provider returned no usable video output for this shot.');
        }

        updateShot(project.id, shot.id, {
          status: 'completed',
          title: planned?.title || shot.title,
          prompt: planned?.prompt || shot.prompt,
          thumbnailUrl: null,
          videoUrl,
        });
        updateGeneration(genId, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
          error: null,
        });
        toast.success(`"${shot.title}" generated!`, { id: genId });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generation failed';
        updateShot(project.id, shot.id, { status: 'failed' });
        updateGeneration(genId, {
          status: 'failed',
          progress: 0,
          error: message,
          completedAt: new Date().toISOString(),
        });
        toast.error(`"${shot.title}" failed: ${message}`, { id: genId });
      } finally {
        const snapshot = useAppStore.getState().getProject(project.id);
        if (snapshot) {
          const allDone = snapshot.shots.every(
            (item) => item.status === 'completed' || item.status === 'failed'
          );
          updateProject(snapshot.id, { status: allDone ? 'ready' : 'generating' });
        }
      }
    },
    [project, addGeneration, updateGeneration, updateProject, updateShot]
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

  const handleImportMedia = useCallback(
    async (fileList: FileList | File[]) => {
      if (!project) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const videos = files.filter((file) => file.type.startsWith('video/'));
      if (videos.length === 0) {
        toast.error('Please choose video files to import.');
        return;
      }

      setImportingMedia(true);
      toast.loading(`Importing ${videos.length} file${videos.length > 1 ? 's' : ''}...`, {
        id: 'import-media',
      });

      let imported = 0;
      let skipped = 0;
      let nextOrder = project.shots.reduce((max, shot) => Math.max(max, shot.order), -1) + 1;

      for (const file of videos) {
        let objectUrl: string | null = null;
        try {
          objectUrl = URL.createObjectURL(file);
          const metadata = await readVideoMetadata(objectUrl);

          const assetId = addAsset({
            name: file.name,
            type: 'video',
            url: objectUrl,
            size: file.size,
            width: metadata.width,
            height: metadata.height,
            duration: metadata.duration,
            mimeType: file.type || 'video/mp4',
            storageMode: 'object-url',
            projectId: project.id,
            volatile: true,
          });

          addShot(project.id, {
            projectId: project.id,
            title: toImportedTitle(file.name),
            prompt: `Imported source clip: ${file.name}`,
            status: 'completed',
            provider: 'imported',
            thumbnailUrl: null,
            videoUrl: objectUrl,
            duration: metadata.duration,
            order: nextOrder,
            sourceType: 'import',
            assetId,
            sourceMimeType: file.type || null,
            sourceSizeBytes: file.size,
            importedAt: new Date().toISOString(),
          });

          imported += 1;
          nextOrder += 1;
        } catch {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          skipped += 1;
        }
      }

      if (imported > 0) {
        updateProject(project.id, { status: 'ready' });
      }

      if (imported > 0) {
        toast.success(`Imported ${imported} clip${imported > 1 ? 's' : ''}.`, {
          id: 'import-media',
        });
      } else {
        toast.error('No clips were imported.', { id: 'import-media' });
      }

      if (skipped > 0) {
        toast.warning(`Skipped ${skipped} file${skipped > 1 ? 's' : ''}.`);
      }

      setImportingMedia(false);
    },
    [project, addAsset, addShot, updateProject]
  );

  if (!project) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center py-32">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold">Project not found</h2>
        <p className="text-vv-secondary mb-6 text-sm">
          This project doesn&apos;t exist or has been deleted.
        </p>
        <Link href="/dashboard" className="vv-btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const completedShots = project.shots.filter((s) => s.status === 'completed').length;
  const totalShots = project.shots.length;

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-vv-muted flex items-center gap-2 text-xs">
            <Link href="/dashboard" className="hover:text-vv-secondary transition-colors">
              Dashboard
            </Link>
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span>Project</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-vv-secondary mt-1 line-clamp-1 text-sm">{project.brief}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-vv-muted text-xs">
            {completedShots}/{totalShots} shots ready
          </span>
          <label className="vv-btn-secondary w-full cursor-pointer sm:w-auto">
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
            {importingMedia ? 'Importing...' : 'Import Media'}
            <input
              ref={importInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              disabled={importingMedia}
              onChange={(event) => {
                if (event.target.files) {
                  void handleImportMedia(event.target.files);
                }
                if (importInputRef.current) {
                  importInputRef.current.value = '';
                }
              }}
            />
          </label>
          <button onClick={handleGenerateAll} className="vv-btn-secondary w-full sm:w-auto">
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
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"
              />
            </svg>
            Generate All
          </button>
          <Link href={`/timeline/${params.id}`} className="vv-btn-primary w-full sm:w-auto">
            <svg
              className="h-4 w-4"
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
            Open Timeline
          </Link>
        </div>
      </div>

      {/* Shot Grid */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <svg
            className="text-accent h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.375"
            />
          </svg>
          <h2 className="text-lg font-bold">Shots ({totalShots})</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.shots.map((shot, index) => (
            <div key={shot.id} className="vv-card-hover group relative overflow-hidden">
              {/* Thumbnail */}
              <div className="bg-vv-base relative mb-4 aspect-video overflow-hidden rounded-lg">
                {shot.thumbnailUrl ? (
                  <MotionImage
                    src={shot.thumbnailUrl}
                    alt={shot.title}
                    width={640}
                    height={360}
                    unoptimized
                    className="h-full w-full object-cover"
                    motionPreset="drift"
                    motionSpeed="medium"
                    motionDelayMs={index * 110}
                  />
                ) : shot.videoUrl ? (
                  <video
                    src={shot.videoUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="text-vv-border h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute right-2 top-2">
                  <span
                    className={`vv-badge text-xs ${
                      shot.status === 'completed'
                        ? 'bg-success/20 text-success'
                        : shot.status === 'processing'
                          ? 'bg-blue-500/20 text-blue-400'
                          : shot.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : shot.status === 'queued'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'text-vv-muted bg-white/10'
                    }`}
                  >
                    {shot.status === 'processing' && (
                      <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    )}
                    {shot.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{shot.title}</h3>
                  <span className="text-vv-muted text-xs">{shot.duration}s</span>
                </div>
                <p className="text-vv-muted line-clamp-2 text-xs">{shot.prompt}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-vv-disabled text-xs capitalize">{shot.provider}</span>
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
            <svg
              className="text-accent h-5 w-5"
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
            <h2 className="text-lg font-bold">Timeline</h2>
          </div>
          <Link href={`/timeline/${params.id}`} className="vv-btn-ghost text-sm">
            Open Full Editor
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
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
                      ? 'animate-pulse border-blue-500/30 bg-blue-500/5'
                      : 'border-vv-border bg-vv-base/50'
                }`}
              >
                <div className="px-2 text-center">
                  <p className="max-w-[100px] truncate text-xs font-medium">{shot.title}</p>
                  <p className="text-vv-muted text-[10px]">{shot.duration}s</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-vv-muted mt-2 text-right text-xs">
            {completedShots} of {totalShots} clips ready ·{' '}
            {project.shots.reduce((a, s) => a + s.duration, 0)}s total
          </div>
        </div>
      </div>
    </div>
  );
}
