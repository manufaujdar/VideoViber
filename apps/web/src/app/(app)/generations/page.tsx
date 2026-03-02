export default function GenerationsPage() {
  const statuses = [
    { key: 'processing', color: 'bg-blue-400', label: 'Processing' },
    { key: 'completed', color: 'bg-emerald-400', label: 'Completed' },
    { key: 'failed', color: 'bg-red-400', label: 'Failed' },
    { key: 'queued', color: 'bg-amber-400', label: 'Queued' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generations</h1>
          <p className="mt-1 text-sm text-vv-secondary">
            Track all your video generation jobs across projects
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Processing', 'Completed', 'Failed'].map((filter) => (
          <button
            key={filter}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
              filter === 'All'
                ? 'bg-accent/10 text-accent ring-1 ring-accent/20'
                : 'text-vv-secondary hover:bg-white/[0.03] hover:text-vv-primary'
            }`}
          >
            {filter}
          </button>
        ))}

        {/* Status legend */}
        <div className="ml-auto hidden items-center gap-3 text-xs text-vv-muted sm:flex">
          {statuses.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="vv-card relative flex flex-col items-center overflow-hidden py-20">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(124, 58, 237, 0.5) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
        <div className="relative">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 ring-1 ring-blue-500/20 animate-float">
            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
            </svg>
          </div>
          <h3 className="mb-2 text-center text-xl font-bold">No generations yet</h3>
          <p className="mb-4 max-w-sm text-center text-sm leading-relaxed text-vv-secondary">
            Generate shots from your projects to track them here. Each generation shows status, provider, and output variants.
          </p>
        </div>
      </div>
    </div>
  );
}
