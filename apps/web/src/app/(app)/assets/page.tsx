export default function AssetsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="mt-1 text-sm text-vv-secondary">
            All uploaded and generated media files
          </p>
        </div>
        <button className="vv-btn-primary w-full sm:w-auto">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload Asset
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Images', 'Videos', 'Reference'].map((filter) => (
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
      </div>

      {/* Empty State */}
      <div className="vv-card relative flex flex-col items-center overflow-hidden py-20">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(124, 58, 237, 0.5) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
        <div className="relative">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/10 ring-1 ring-accent/20 animate-float">
            <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="mb-2 text-center text-xl font-bold">No assets yet</h3>
          <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-vv-secondary">
            Upload reference images or generate your first shots to see them here.
          </p>
          <div className="text-center">
            <button className="vv-btn-primary px-8 py-3">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload Your First Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
