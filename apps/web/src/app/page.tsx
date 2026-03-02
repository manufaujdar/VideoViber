import Link from 'next/link';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VideoViber',
  applicationCategory: 'MultimediaApplication',
  description:
    'Agentic spec-driven video workspace. Turn vague creative intent into an editable first cut using multiple AI video providers.',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const features = [
  {
    title: 'Multi-Track Timeline',
    desc: 'Professional non-linear editing with video and audio tracks. Drag, trim, reorder — exactly like the editors you already love.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
    gradient: 'from-violet-500/15 to-purple-500/15',
  },
  {
    title: 'AI Shot Generation',
    desc: 'Describe a creative brief. Our AI decomposes it into structured shots with prompts, camera angles, and continuity notes.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    gradient: 'from-blue-500/15 to-cyan-500/15',
  },
  {
    title: 'Multi-Provider Engine',
    desc: 'Runway Gen-3, Google Veo, Luma Dream Machine — use any provider for any shot. Compare variants side by side.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
      </svg>
    ),
    gradient: 'from-emerald-500/15 to-green-500/15',
  },
  {
    title: 'Smart Asset Library',
    desc: 'Upload reference images, clips, and audio. Drag-and-drop organization with grid and list views, search, and bulk actions.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    gradient: 'from-orange-500/15 to-amber-500/15',
  },
  {
    title: 'Real-Time Progress',
    desc: 'Live generation tracking with progress bars, status filters, and async notifications. Cancel or retry any job instantly.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    gradient: 'from-rose-500/15 to-pink-500/15',
  },
  {
    title: 'Export & Iterate',
    desc: 'Export rough cuts as MP4 or editable sequences. Every change is non-destructive and versioned for easy iteration.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    gradient: 'from-teal-500/15 to-cyan-500/15',
  },
];

const providers = [
  { name: 'Runway', sub: 'Gen-3 Alpha', letter: 'R', gradient: 'from-violet-500 to-purple-500', desc: 'Cinematic quality' },
  { name: 'Veo', sub: 'Vertex AI', letter: 'V', gradient: 'from-blue-500 to-cyan-500', desc: 'Google-powered' },
  { name: 'Luma', sub: 'Dream Machine', letter: 'L', gradient: 'from-emerald-500 to-green-500', desc: 'Fast & creative' },
];

const capabilities = [
  { label: 'Shot Decomposition', value: 'AI-driven', icon: '✦' },
  { label: 'Timeline Editing', value: 'Multi-track', icon: '◈' },
  { label: 'Asset Management', value: 'Drag & Drop', icon: '⬡' },
  { label: 'Export Formats', value: 'MP4 / Sequence', icon: '◇' },
  { label: 'Keyboard Shortcuts', value: 'Full Support', icon: '⌘' },
  { label: 'Auto-save', value: 'Always On', icon: '↻' },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Background Effects ─────────────────────────── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px] animate-glow-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/8 blur-[120px] animate-glow-pulse delay-300" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-accent/5 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(124, 58, 237, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ─── Nav ────────────────────────────────────────── */}
      <header className="glass-strong fixed top-0 z-50 w-full border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-400 shadow-lg shadow-accent/30">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
              <svg className="relative ml-0.5 h-4 w-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">VideoViber</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-vv-secondary transition-colors hover:text-vv-primary">Features</a>
            <a href="#how" className="text-sm text-vv-secondary transition-colors hover:text-vv-primary">How It Works</a>
            <a href="#providers" className="text-sm text-vv-secondary transition-colors hover:text-vv-primary">Providers</a>
            <Link href="/dashboard" className="vv-btn-primary">
              Get Started
            </Link>
          </nav>
          {/* Mobile */}
          <Link href="/dashboard" className="vv-btn-primary sm:hidden">
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col items-center px-6 pt-16">
        <div className="mx-auto max-w-4xl text-center pt-20 sm:pt-28">
          {/* Badge */}
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-vv-secondary backdrop-blur-sm">
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            AI-Powered Video Editor
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100 mb-6 text-5xl font-extrabold tracking-tight opacity-0 sm:text-7xl sm:leading-[1.05]">
            From vague idea to{' '}
            <span className="gradient-text animate-gradient">
              editable first cut
            </span>
          </h1>

          {/* Subhead */}
          <p className="animate-fade-in-up delay-200 mb-12 max-w-2xl mx-auto text-lg leading-relaxed text-vv-secondary opacity-0 sm:text-xl">
            VideoViber converts your creative brief into a structured shot plan,
            generates clips from multiple AI providers, and assembles them into
            an editable timeline — in under 10 minutes.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up delay-300 flex flex-col items-center justify-center gap-4 opacity-0 sm:flex-row">
            <Link href="/projects/new" className="vv-btn-primary px-8 py-3.5 text-base w-full sm:w-auto">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Creating — Free
            </Link>
            <a href="#how" className="vv-btn-ghost px-8 py-3.5 text-base w-full sm:w-auto">
              How It Works
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Trust signals */}
          <div className="animate-fade-in-up delay-500 mt-16 flex flex-wrap items-center justify-center gap-6 text-xs text-vv-muted opacity-0">
            {['BYOK — Your keys, your costs', 'Multi-provider (Runway, Veo, Luma)', 'Non-destructive editing', 'AES-256 encrypted'].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Editor Preview ──────────────────────────────── */}
        <div className="relative mx-auto mt-20 w-full max-w-5xl animate-fade-in-up delay-500 opacity-0">
          <div className="rounded-2xl border border-white/10 bg-vv-surface/80 p-1.5 shadow-2xl shadow-accent/5 backdrop-blur-xl">
            <div className="rounded-xl bg-vv-base overflow-hidden">
              {/* Mock editor toolbar */}
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="ml-4 flex-1 rounded bg-white/5 px-3 py-1 text-xs text-vv-muted text-center">
                  VideoViber — Timeline Editor
                </div>
              </div>
              {/* Mock editor body */}
              <div className="grid grid-cols-4 gap-px bg-white/5">
                {/* Shot panel */}
                <div className="bg-vv-base p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-vv-muted/60 mb-3">Shots</p>
                  {['Wide Establishing', 'Character Close-up', 'Detail Insert', 'Aerial Sweep'].map((s, i) => (
                    <div key={s} className={`rounded-lg px-3 py-2 text-xs transition-colors ${i === 0 ? 'bg-accent/10 text-accent border border-accent/20' : 'text-vv-secondary hover:bg-white/[0.02]'}`}>
                      {s}
                    </div>
                  ))}
                </div>
                {/* Preview area */}
                <div className="col-span-2 bg-vv-base flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                      <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </div>
                    <p className="text-xs text-vv-muted">Preview Window</p>
                  </div>
                </div>
                {/* Inspector */}
                <div className="bg-vv-base p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-vv-muted/60 mb-3">Inspector</p>
                  {['Duration', 'Provider', 'Status', 'Trim'].map((f) => (
                    <div key={f} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-vv-muted">{f}</span>
                      <span className="text-vv-disabled">—</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mock timeline */}
              <div className="border-t border-white/5 p-4">
                <div className="flex gap-1">
                  {['from-violet-500/20 to-purple-500/20', 'from-blue-500/20 to-cyan-500/20', 'from-emerald-500/20 to-green-500/20', 'from-orange-500/20 to-amber-500/20'].map((g, i) => (
                    <div key={i} className={`h-10 flex-1 rounded bg-gradient-to-r ${g} border border-white/5`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow under preview */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 h-40 w-3/4 rounded-full bg-accent/15 blur-[80px]" />
        </div>

        {/* ─── Features Grid ───────────────────────────────── */}
        <section id="features" className="relative mx-auto mt-40 w-full max-w-6xl px-4">
          <div className="mb-16 text-center">
            <p className="vv-badge bg-accent/10 text-accent mb-4">Capabilities</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for{' '}
              <span className="gradient-text">AI video production</span>
            </h2>
            <p className="mt-4 text-vv-secondary max-w-xl mx-auto">
              Professional tools designed with simplicity in mind. Built for creators who move fast.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`vv-card-hover group relative animate-fade-in-up opacity-0 ${
                  ['delay-100', 'delay-200', 'delay-300', 'delay-100', 'delay-200', 'delay-300'][i]
                }`}
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-accent ring-1 ring-accent/10 transition-transform group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-vv-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── How It Works ─────────────────────────────── */}
        <section id="how" className="relative mx-auto mt-40 w-full max-w-6xl px-4">
          <div className="mb-16 text-center">
            <p className="vv-badge bg-accent/10 text-accent mb-4">Workflow</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to your first cut
            </h2>
            <p className="mt-4 text-vv-secondary">
              From creative spark to editable video in minutes, not hours.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01', title: 'Describe Your Vibe',
                desc: 'Enter a creative brief. Upload reference images. Our AI decomposes it into scenes, shots, and a continuity pack.',
                icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>,
                gradient: 'from-violet-500/20 to-purple-500/20',
              },
              {
                step: '02', title: 'Generate & Iterate',
                desc: 'Multi-provider generation with variant comparison. Extend, regenerate, edit. Everything is async, versioned, and non-destructive.',
                icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" /></svg>,
                gradient: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                step: '03', title: 'Assemble & Export',
                desc: 'Drag shots onto the timeline. Trim, reorder, swap clips. Export an editable rough cut as MP4 or sequence.',
                icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>,
                gradient: 'from-emerald-500/20 to-green-500/20',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`vv-card-hover group relative animate-fade-in-up opacity-0 ${
                  i === 0 ? 'delay-100' : i === 1 ? 'delay-200' : 'delay-300'
                }`}
              >
                <div className="absolute right-5 top-5 text-4xl font-black text-vv-border-subtle/50 transition-colors group-hover:text-accent/20">
                  {feature.step}
                </div>
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-accent ring-1 ring-accent/10`}>
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-vv-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Providers ──────────────────────────────────── */}
        <section id="providers" className="relative mx-auto mt-40 w-full max-w-4xl px-4">
          <div className="mb-16 text-center">
            <p className="vv-badge bg-accent/10 text-accent mb-4">Integrations</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your favorite AI providers,{' '}
              <span className="gradient-text">one workspace</span>
            </h2>
            <p className="mt-4 text-vv-secondary max-w-xl mx-auto">
              Bring your own API keys. No markups, no middleman. Direct access to the world&apos;s best video models.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {providers.map((p, i) => (
              <div key={p.name} className={`vv-card-hover group text-center animate-fade-in-up opacity-0 ${['delay-100', 'delay-200', 'delay-300'][i]}`}>
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${p.gradient} text-xl font-bold text-white shadow-lg ring-1 ring-white/10 transition-transform group-hover:scale-110`}>
                  {p.letter}
                </div>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="text-sm text-vv-muted mt-1">{p.sub}</p>
                <p className="text-xs text-vv-disabled mt-3">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Capabilities Grid ───────────────────────────── */}
        <section className="relative mx-auto mt-40 w-full max-w-4xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for professionals
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {capabilities.map((cap) => (
              <div key={cap.label} className="vv-card group text-center transition-all hover:border-accent/30 hover:bg-accent/[0.02]">
                <div className="mb-2 text-2xl text-accent">{cap.icon}</div>
                <p className="text-sm font-bold">{cap.label}</p>
                <p className="mt-1 text-xs text-vv-muted">{cap.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Bottom CTA ─────────────────────────────────── */}
        <section className="relative mx-auto mt-40 w-full max-w-3xl px-4 pb-20">
          <div className="vv-card relative overflow-hidden p-12 text-center border-accent/20">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-2/3 rounded-full bg-accent/10 blur-[60px]" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to create?
              </h2>
              <p className="text-vv-secondary mb-8 max-w-md mx-auto">
                Start your first AI-powered video project in under 60 seconds. No credit card required.
              </p>
              <Link href="/projects/new" className="vv-btn-primary px-10 py-4 text-base">
                Start Your First Project →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="relative border-t border-white/5 bg-vv-surface/50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-purple-400 shadow-md shadow-accent/30">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
                  <svg className="relative ml-0.5 h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-base font-bold tracking-tight">VideoViber</span>
              </Link>
              <p className="text-sm text-vv-muted max-w-xs leading-relaxed">
                Spec-driven video workspace. Turn vague creative intent into an editable first cut using AI.
              </p>
            </div>
            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-vv-muted/60 mb-4">Product</p>
              <ul className="space-y-2.5">
                {[{ label: 'Dashboard', href: '/dashboard' }, { label: 'New Project', href: '/projects/new' }, { label: 'Assets', href: '/assets' }, { label: 'Generations', href: '/generations' }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-vv-secondary hover:text-vv-primary transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Account */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-vv-muted/60 mb-4">Account</p>
              <ul className="space-y-2.5">
                {[{ label: 'Settings', href: '/settings' }, { label: 'API Keys', href: '/settings/keys' }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-vv-secondary hover:text-vv-primary transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/5 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-vv-disabled">© {new Date().getFullYear()} VideoViber. All rights reserved.</p>
            <p className="text-xs text-vv-disabled">Built for creators who iterate fast</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
