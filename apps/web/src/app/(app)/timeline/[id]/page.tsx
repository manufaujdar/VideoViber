/**
 * Timeline Editor — the full editing surface for a project&apos;s timeline.
 */
export default function TimelineEditorPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Timeline Editor</h1>
            <p className="text-sm text-vv-muted">
              Project: <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs font-mono">{params.id}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="vv-btn-ghost px-3">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Undo
          </button>
          <button className="vv-btn-ghost px-3">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
            </svg>
            Redo
          </button>
          <div className="mx-1 h-6 w-px bg-white/10" />
          <button className="vv-btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Export Rough Cut
          </button>
        </div>
      </div>

      {/* Main area: Preview + Inspector */}
      <div className="grid flex-1 gap-4 lg:grid-cols-3">
        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="vv-card aspect-video flex items-center justify-center bg-gradient-to-br from-vv-surface to-vv-base">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                <svg className="h-7 w-7 text-vv-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-vv-muted">Timeline preview</p>
              <p className="mt-1 text-xs text-vv-disabled">
                Add clips to the timeline to preview
              </p>
            </div>
          </div>
        </div>

        {/* Clip Inspector */}
        <div className="vv-card">
          <div className="flex items-center gap-2 mb-5">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <h3 className="text-sm font-bold text-vv-secondary">Clip Inspector</h3>
          </div>
          <p className="text-sm text-vv-muted mb-6">Select a clip on the timeline to inspect</p>

          {/* Inspector fields */}
          <div className="space-y-3">
            {['Duration', 'Trim Start', 'Trim End', 'Provider', 'Status'].map((field) => (
              <div key={field} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-sm">
                <span className="text-vv-muted">{field}</span>
                <span className="text-vv-disabled font-mono text-xs">—</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="shrink-0">
        <div className="vv-card">
          {/* Time ruler */}
          <div className="mb-2 flex items-center justify-between text-xs text-vv-muted font-mono">
            {['0:00', '0:10', '0:20', '0:30', '0:40'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          {/* Track */}
          <div className="flex h-20 items-center rounded-lg border-2 border-dashed border-vv-border bg-vv-base/30 transition-colors hover:border-accent/20">
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-sm text-vv-muted">
                Drag clips here to build your timeline
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-vv-muted transition-colors hover:bg-white/[0.03] hover:text-vv-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062a1.125 1.125 0 011.683.977v8.123z" />
                </svg>
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent transition-all hover:bg-accent/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-vv-muted transition-colors hover:bg-white/[0.03] hover:text-vv-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-vv-muted font-mono">0 clips · 0:00 total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
