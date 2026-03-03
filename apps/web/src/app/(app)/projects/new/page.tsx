'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateShotsForProject, useAppStore } from '@/app/store';
import { toast } from 'sonner';

const providers = [
  { name: 'Gemini', sub: 'Google AI', id: 'gemini', gradient: 'from-blue-500/10 to-indigo-500/10' },
  {
    name: 'Runway',
    sub: 'Gen-3 Alpha',
    id: 'runway',
    gradient: 'from-violet-500/10 to-purple-500/10',
  },
  { name: 'Veo', sub: 'Vertex AI', id: 'veo', gradient: 'from-blue-500/10 to-cyan-500/10' },
  {
    name: 'Luma',
    sub: 'Dream Machine',
    id: 'luma',
    gradient: 'from-emerald-500/10 to-green-500/10',
  },
];

const aspectRatioOptions = ['16:9', '9:16', '1:1', '4:5', '21:9'] as const;
const shotCountOptions = [4, 6, 8, 10] as const;
const maxFileSizeBytes = 10 * 1024 * 1024;

function parsePlannerShots(content: string, maxShots: number) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\s*(?:shot\s*\d+[:.-]?|\d+[).:-]?|[-*])\s*/i, ''))
    .filter((line) => line.length > 20);

  const deduped = Array.from(new Set(lines)).slice(0, maxShots);

  return deduped.map((line, index) => {
    const titled = line.match(/^([^:]{4,40}):\s*(.+)$/);
    if (titled) {
      const [, rawTitle = '', rawPrompt = ''] = titled;
      return {
        title: rawTitle.trim() || `Shot ${index + 1}`,
        prompt: rawPrompt.trim() || line,
      };
    }

    const fallbackTitle = line
      .replace(/[.!?].*$/, '')
      .split(/\s+/)
      .slice(0, 4)
      .join(' ')
      .trim();

    return {
      title: fallbackTitle || `Shot ${index + 1}`,
      prompt: line,
    };
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function CreateProjectPage() {
  const router = useRouter();
  const addProject = useAppStore((s) => s.addProject);
  const addAsset = useAppStore((s) => s.addAsset);
  const settings = useAppStore((s) => s.settings);

  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [provider, setProvider] = useState(settings.defaultProvider || 'gemini');
  const [files, setFiles] = useState<File[]>([]);
  const [shotCount, setShotCount] = useState<number>(6);
  const [durationSeconds, setDurationSeconds] = useState<number>(5);
  const [aspectRatio, setAspectRatio] = useState<(typeof aspectRatioOptions)[number]>('16:9');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => !submitting && title.trim().length > 0 && brief.trim().length > 0,
    [submitting, title, brief]
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
    toast.loading('Planning shots with AI...', { id: 'create' });

    try {
      const baseShots = generateShotsForProject(brief, provider, shotCount).map((shot) => ({
        ...shot,
        duration: durationSeconds,
      }));

      let finalShots = baseShots;
      let planningSource = 'local planner';

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: brief,
            provider,
            duration: durationSeconds,
            aspectRatio,
            shotCount,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || `Planner request failed (${response.status})`);
        }

        const planned = parsePlannerShots(payload?.result?.content ?? '', shotCount);

        if (planned.length > 0) {
          finalShots = baseShots.map((shot, index) => {
            const candidate = planned[index];
            if (!candidate) return shot;
            return {
              ...shot,
              title: candidate.title || shot.title,
              prompt: candidate.prompt || shot.prompt,
            };
          });
          planningSource = `${provider} planner`;
        }
      } catch (plannerError) {
        const plannerMessage =
          plannerError instanceof Error ? plannerError.message : 'Planner unavailable';
        toast.warning(`Falling back to local shot planner: ${plannerMessage}`);
      }

      const projectId = addProject({
        title: title.trim(),
        brief: brief.trim(),
        provider,
        shots: finalShots.map((s) => ({ ...s, projectId: '' })),
      });

      const store = useAppStore.getState();
      const project = store.getProject(projectId);
      if (project) {
        store.updateProject(projectId, {
          shots: project.shots.map((s) => ({ ...s, projectId })),
          status: 'generating',
        });
      }

      if (files.length > 0) {
        try {
          await Promise.all(
            files.map(async (file) => {
              const url = await fileToDataUrl(file);
              addAsset({
                name: file.name,
                type: 'reference',
                url,
                size: file.size,
              });
            })
          );
        } catch {
          toast.warning('Project created, but some reference files failed to attach.');
        }
      }

      toast.success(`Created "${title}" with ${finalShots.length} shots via ${planningSource}`, {
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
        <div className="vv-badge bg-accent/10 text-accent mb-3">New Project</div>
        <h1 className="text-2xl font-bold tracking-tight">Describe Your Vision</h1>
        <p className="text-vv-secondary mt-2 text-sm leading-relaxed">
          Convert a creative brief into production-ready shots, then move directly into generation.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="title" className="vv-label">
              Project Title
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
              {[3, 4, 5, 6, 8, 10].map((seconds) => (
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
            Creative Brief
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
          <label className="vv-label">Reference Images (optional)</label>
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
          <label className="vv-label">Planning Provider</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`vv-card group cursor-pointer text-center transition-all duration-200 ${
                  provider === p.id
                    ? 'border-accent/50 bg-accent/5 ring-accent/20 ring-1'
                    : 'hover:border-accent/20'
                }`}
              >
                <div
                  className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${p.gradient} text-accent ring-accent/10 text-sm font-bold ring-1`}
                >
                  {p.name[0]}
                </div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-vv-muted mt-0.5 text-xs">{p.sub}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-vv-surface/50 flex flex-col gap-4 rounded-xl border border-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-vv-secondary text-sm">
            Plan {shotCount} shots at {durationSeconds}s each in {aspectRatio}.
          </p>
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
                Planning...
              </>
            ) : (
              <>
                Generate Shot Plan
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
