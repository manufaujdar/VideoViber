'use client';

import { ProviderId } from '@videoviber/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Shot, useAppStore } from '@/features/workspace';
import { uploadAssetFile } from '@/lib/asset-upload';
import {
  defaultProviderRuntimeHealth,
  providerCatalog,
  type ProviderRuntimeHealth,
} from '@/lib/providers';
import { parsePlannerShots } from '@/lib/shot-planner';
import { toast } from 'sonner';

const aspectRatioOptions = ['16:9', '9:16', '1:1', '4:5', '21:9'] as const;
const shotCountOptions = [4, 6, 8, 10] as const;
const clipDurationOptions = [4, 6, 8] as const;
const maxFileSizeBytes = 10 * 1024 * 1024;

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

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function CreateProjectPage() {
  const router = useRouter();
  const addProject = useAppStore((s) => s.addProject);
  const addAsset = useAppStore((s) => s.addAsset);
  const settings = useAppStore((s) => s.settings);

  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [provider, setProvider] = useState<ProviderId>(
    (settings.defaultProvider as ProviderId) || ProviderId.GEMINI
  );
  const [providerHealth, setProviderHealth] = useState<ProviderRuntimeHealth[]>(
    defaultProviderRuntimeHealth
  );
  const [files, setFiles] = useState<File[]>([]);
  const [shotCount, setShotCount] = useState<number>(6);
  const [durationSeconds, setDurationSeconds] = useState<number>(6);
  const [aspectRatio, setAspectRatio] = useState<(typeof aspectRatioOptions)[number]>('16:9');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProviderHealth = async () => {
      try {
        const response = await fetch('/api/generate', { method: 'GET' });
        if (!response.ok) return;
        const payload = await response.json();
        if (!mounted || !Array.isArray(payload?.providers)) return;
        const parsed = payload.providers.filter(
          (item: unknown): item is ProviderRuntimeHealth =>
            Boolean(
              item &&
                typeof item === 'object' &&
                'id' in item &&
                'configured' in item &&
                'serverImplemented' in item
            )
        );
        if (parsed.length > 0) {
          setProviderHealth(parsed);
        }
      } catch {
        // Keep defaults for offline/local environments.
      }
    };

    loadProviderHealth();
    return () => {
      mounted = false;
    };
  }, []);

  const healthByProvider = useMemo(
    () =>
      providerHealth.reduce(
        (acc, entry) => {
          acc[entry.id] = entry;
          return acc;
        },
        {} as Record<ProviderId, ProviderRuntimeHealth>
      ),
    [providerHealth]
  );

  const implementedProviders = useMemo(
    () => providerCatalog.filter((provider) => healthByProvider[provider.id]?.serverImplemented),
    [healthByProvider]
  );

  const activeProviderHealth = healthByProvider[provider];
  const providerConfigured = activeProviderHealth?.configured ?? false;

  useEffect(() => {
    const firstProvider = implementedProviders[0];
    if (!firstProvider) {
      return;
    }

    if (!implementedProviders.some((entry) => entry.id === provider)) {
      setProvider(firstProvider.id);
    }
  }, [implementedProviders, provider]);

  const canSubmit = useMemo(
    () => !submitting && title.trim().length > 0 && brief.trim().length > 0 && providerConfigured,
    [submitting, title, brief, providerConfigured]
  );

  const addFiles = useCallback((incoming: File[]) => {
    const validImages = incoming.filter((file) => file.type.startsWith('image/'));
    const invalidSize = validImages.filter((file) => file.size > maxFileSizeBytes);
    const accepted = validImages.filter((file) => file.size <= maxFileSizeBytes);

    if (invalidSize.length > 0) {
      toast.warning(`Skipped ${invalidSize.length} file(s) larger than 10MB`);
    }

    if (incoming.length > validImages.length) {
      toast.warning('Only image references are supported in this step');
    }

    setFiles((prev) => [...prev, ...accepted].slice(0, 20));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files));
      }
    },
    [addFiles]
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    if (!brief.trim()) {
      toast.error('Please describe your creative vision');
      return;
    }

    setSubmitting(true);
    toast.loading('Planning shots...', { id: 'create' });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: brief,
          provider,
          workflow: 'plan',
          duration: durationSeconds,
          aspectRatio,
          shotCount,
        }),
      });

      const payload = await readResponsePayload(response);
      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.details ||
            payload?.hint ||
            (typeof payload?.raw === 'string' ? payload.raw.slice(0, 220) : undefined) ||
            `Planner request failed (${response.status})`
        );
      }

      const planned = parsePlannerShots(payload?.result?.content ?? '', shotCount);
      if (planned.length === 0) {
        throw new Error('Planner returned no usable shots. Refine the brief and try again.');
      }
      if (planned.length < shotCount) {
        throw new Error(
          `Planner returned ${planned.length} shot(s), expected ${shotCount}. Retry with a more specific brief.`
        );
      }

      const finalShots: Shot[] = planned.slice(0, shotCount).map((candidate, index) => ({
        id: createId(),
        projectId: '',
        title: candidate.title || `Shot ${index + 1}`,
        prompt:
          candidate.prompt ||
          `${brief.trim()} Focus this shot on sequence beat ${index + 1} of ${shotCount}.`,
        status: 'draft',
        provider,
        thumbnailUrl: null,
        videoUrl: null,
        duration: durationSeconds,
        order: index,
        createdAt: new Date().toISOString(),
      }));

      const projectId = addProject({
        title: title.trim(),
        brief: brief.trim(),
        provider,
        shots: finalShots,
      });

      if (files.length > 0) {
        try {
          await Promise.all(
            files.map(async (file) => {
              const uploaded = await uploadAssetFile(file, { projectId });
              addAsset({
                name: file.name,
                type: 'reference',
                url: uploaded.url,
                storagePath: uploaded.storagePath,
                size: file.size,
                mimeType: file.type || 'image/jpeg',
                storageMode: 'remote-url',
                projectId,
              });
            })
          );
        } catch (uploadError) {
          const message =
            uploadError instanceof Error
              ? uploadError.message
              : 'Some reference files failed to upload.';
          toast.warning(`Project created, but references failed: ${message}`);
        }
      }

      toast.success(`Created "${title}" with ${finalShots.length} planned shots`, {
        id: 'create',
      });
      router.push(`/projects/${projectId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(message, { id: 'create' });
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl space-y-8">
      <div>
        <div className="vv-badge bg-accent/10 text-accent mb-3">New Scene</div>
        <h1 className="text-3xl font-bold tracking-tight">Initialize Scene</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Define simulation parameters and provide reference data for the render engine.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="title" className="vv-label">
              Scene Identifier
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neon City Dreams"
              className="vv-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="vv-label">Shots to plan</label>
            <select
              value={shotCount}
              onChange={(e) => setShotCount(Number(e.target.value))}
              className="vv-input w-full"
            >
              {shotCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count} shots
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="vv-label">Clip duration</label>
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="vv-input w-full"
            >
              {clipDurationOptions.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds}s per shot
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="vv-label">Aspect ratio</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {aspectRatioOptions.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    aspectRatio === ratio
                      ? 'bg-accent/10 text-accent ring-accent/20 ring-1'
                      : 'bg-vv-surface text-vv-secondary hover:bg-vv-hover hover:text-vv-primary'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="brief" className="vv-label flex items-center gap-2">
            <svg
              className="text-accent h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            Director&apos;s Prompt
          </label>
          <textarea
            id="brief"
            rows={7}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Describe mood, setting, style references, camera movement, and pacing. The planner will convert this into detailed shots."
            className="vv-input w-full resize-none"
          />
          <p className="text-vv-muted text-xs">
            Include camera language, visual motifs, and pacing cues for better shot planning.
          </p>
        </div>

        <div className="space-y-2">
          <label className="vv-label">Reference Assets (Optional)</label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-vv-border bg-vv-base/50 hover:border-accent/40 hover:bg-accent/[0.02] group relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed py-14 transition-all duration-200"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="text-center">
              <div className="bg-accent/10 text-accent mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p className="text-vv-secondary text-sm">
                Drop images here or <span className="text-accent font-semibold">browse</span>
              </p>
              <p className="text-vv-muted mt-1 text-xs">PNG or JPG, up to 10MB each</p>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="text-vv-secondary flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs"
                >
                  <svg
                    className="text-accent h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  {file.name}
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="text-vv-muted ml-1 transition-colors hover:text-red-400"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="vv-label">Generation Engine</label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {implementedProviders.map((p) => {
              const runtime = healthByProvider[p.id];
              const isConfigured = runtime?.configured ?? false;
              const isActive = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 ${
                    isActive
                      ? 'border-accent bg-accent/5 shadow-lg shadow-accent/20 ring-1 ring-accent/50'
                      : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div
                    className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${p.gradient} text-accent ring-accent/10 text-sm font-bold ring-1`}
                  >
                    {p.letter}
                  </div>
                  <p className="text-sm font-semibold">{p.shortName}</p>
                  <p className="text-vv-muted mt-0.5 text-xs">
                    {isConfigured ? 'Configured' : 'Missing server key'}
                  </p>
                </button>
              );
            })}
          </div>
          {implementedProviders.length === 0 && (
            <p className="text-vv-muted text-xs">
              No planning providers are implemented on this server yet.
            </p>
          )}
        </div>

        <div className="bg-vv-surface/50 flex flex-col gap-4 rounded-xl border border-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="text-vv-secondary">
              Plan {shotCount} shots at {durationSeconds}s each in {aspectRatio}.
            </p>
            {(healthByProvider[provider]?.configured ?? false) === false && (
              <p className="text-vv-muted mt-1 text-xs">
                Provider key is missing on the server. Configure it in Settings → API Keys before
                creating projects.
              </p>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="vv-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Initializing...
              </>
            ) : (
              <>
                Initialize Plan
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
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
