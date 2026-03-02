'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, generateShotsForProject } from '@/app/store';
import { toast } from 'sonner';

export default function CreateProjectPage() {
  const router = useRouter();
  const addProject = useAppStore((s) => s.addProject);
  const settings = useAppStore((s) => s.settings);

  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [provider, setProvider] = useState(settings.defaultProvider || 'runway');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const providers = [
    { name: 'Runway', sub: 'Gen-3 Alpha', id: 'runway', gradient: 'from-violet-500/10 to-purple-500/10' },
    { name: 'Veo', sub: 'Vertex AI', id: 'veo', gradient: 'from-blue-500/10 to-cyan-500/10' },
    { name: 'Luma', sub: 'Dream Machine', id: 'luma', gradient: 'from-emerald-500/10 to-green-500/10' },
  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

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
    toast.loading('Generating shot plan...', { id: 'create' });

    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 1200));

    const shots = generateShotsForProject(brief, provider);
    const projectId = addProject({
      title: title.trim(),
      brief: brief.trim(),
      provider,
      shots: shots.map((s) => ({ ...s, projectId: '' })),
    });

    // Update shots with correct projectId
    const store = useAppStore.getState();
    const project = store.getProject(projectId);
    if (project) {
      store.updateProject(projectId, {
        shots: project.shots.map((s) => ({ ...s, projectId })),
        status: 'generating',
      });
    }

    toast.success(`Created "${title}" with ${shots.length} shots`, { id: 'create' });
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="vv-badge bg-accent/10 text-accent mb-3">New Project</div>
        <h1 className="text-2xl font-bold tracking-tight">Describe Your Vision</h1>
        <p className="mt-2 text-sm leading-relaxed text-vv-secondary">
          Enter a creative brief and we&apos;ll decompose it into scenes, shots, and a continuity pack.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Project Title */}
        <div className="space-y-2">
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

        {/* Vibe Brief */}
        <div className="space-y-2">
          <label htmlFor="brief" className="vv-label flex items-center gap-2">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Vibe Brief
          </label>
          <textarea
            id="brief"
            rows={6}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={`Describe your creative vision in a few sentences. Be as vague or specific as you want — we'll decompose it into structured shots.\n\nExample: A dreamy sunset timelapse over a neon-lit Tokyo skyline, transitioning to close-up street-level shots of rain-soaked reflections, cyberpunk aesthetic with gentle camera movement...`}
            className="vv-input w-full resize-none"
          />
          <p className="text-xs text-vv-muted">
            Describe the mood, style, subjects, and rough narrative. The AI will turn this into a scene breakdown and shot list.
          </p>
        </div>

        {/* Reference Images */}
        <div className="space-y-2">
          <label className="vv-label">Reference Images (optional)</label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="group relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-vv-border bg-vv-base/50 py-14 transition-all duration-200 hover:border-accent/40 hover:bg-accent/[0.02]"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-sm text-vv-secondary">
                Drop images here or{' '}
                <span className="font-semibold text-accent">browse</span>
              </p>
              <p className="mt-1 text-xs text-vv-muted">PNG, JPG up to 10MB each</p>
            </div>
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-vv-secondary">
                  <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  {f.name}
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="ml-1 text-vv-muted hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="vv-label">Default Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`vv-card group cursor-pointer text-center transition-all duration-200 ${
                  provider === p.id
                    ? 'border-accent/50 bg-accent/5 ring-1 ring-accent/20'
                    : 'hover:border-accent/20'
                }`}
              >
                <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${p.gradient} text-sm font-bold text-accent ring-1 ring-accent/10`}>
                  {p.name[0]}
                </div>
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="mt-0.5 text-xs text-vv-muted">{p.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-vv-surface/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <p className="text-sm text-vv-secondary">
              This will generate 4–8 shots based on your brief
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="vv-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                Generate Shot Plan
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
