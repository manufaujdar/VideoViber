'use client';

export default function CreateProjectPage() {
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
            placeholder="Describe your creative vision in a few sentences. Be as vague or specific as you want — we'll decompose it into structured shots.

Example: A dreamy sunset timelapse over a neon-lit Tokyo skyline, transitioning to close-up street-level shots of rain-soaked reflections, cyberpunk aesthetic with gentle camera movement..."
            className="vv-input w-full resize-none"
          />
          <p className="text-xs text-vv-muted">
            Describe the mood, style, subjects, and rough narrative. The AI will turn this into a scene breakdown and shot list.
          </p>
        </div>

        {/* Reference Images */}
        <div className="space-y-2">
          <label className="vv-label">Reference Images (optional)</label>
          <div className="group relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-vv-border bg-vv-base/50 py-14 transition-all duration-200 hover:border-accent/40 hover:bg-accent/[0.02]">
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
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="vv-label">Default Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Runway', sub: 'Gen-3 Alpha', gradient: 'from-violet-500/10 to-purple-500/10' },
              { name: 'Veo', sub: 'Vertex AI', gradient: 'from-blue-500/10 to-cyan-500/10' },
              { name: 'Luma', sub: 'Dream Machine', gradient: 'from-emerald-500/10 to-green-500/10' },
            ].map((provider) => (
              <button
                key={provider.name}
                className="vv-card-hover group cursor-pointer text-center"
              >
                <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${provider.gradient} text-sm font-bold text-accent ring-1 ring-accent/10`}>
                  {provider.name[0]}
                </div>
                <p className="font-semibold text-sm">{provider.name}</p>
                <p className="mt-0.5 text-xs text-vv-muted">{provider.sub}</p>
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
          <button className="vv-btn-primary">
            Generate Shot Plan
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
