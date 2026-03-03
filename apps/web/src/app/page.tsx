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
  { name: 'Gemini', sub: 'Google AI', letter: 'G', gradient: 'from-blue-500 to-indigo-500', desc: 'Multimodal AI' },
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
    <div className="relative flex flex-col overflow-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Background Effects ─────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
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

      <header className="absolute inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 backdrop-blur-md border-b border-vv-border-subtle bg-vv-base/50">
        <Link href="/" className="flex items-center gap-2 text-vv-primary transition-opacity hover:opacity-80">
          <svg className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-lg font-bold tracking-tight">VideoViber</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/features" className="text-sm font-medium text-vv-secondary hover:text-vv-primary transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm font-medium text-vv-secondary hover:text-vv-primary transition-colors">Pricing</Link>
          <Link href="/about" className="text-sm font-medium text-vv-secondary hover:text-vv-primary transition-colors">About</Link>
        </nav>

        {/* Global CTA */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden text-sm font-medium text-vv-secondary hover:text-vv-primary sm:block transition-colors">
            Sign in
          </Link>
          <Link href="/dashboard" className="vv-btn-primary rounded-xl px-5 py-2 text-sm">
            Launch App
          </Link>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pt-32 pb-40">
        <div className="mx-auto max-w-4xl text-center">
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
            <Link href="/projects/new" className="vv-btn-primary rounded-xl px-8 py-3.5 text-base w-full sm:w-auto shadow-xl shadow-accent/20">
              Start Creating — Free
            </Link>
            <Link href="/features" className="vv-btn-ghost rounded-xl px-8 py-3.5 text-base w-full sm:w-auto">
              Explore features
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ─── Editor Preview ──────────────────────────────── */}
        <div className="relative mx-auto mt-24 w-full max-w-5xl animate-slide-up delay-500 opacity-0">
          {/* Glassmorphic Browser Window */}
          <div className="glass rounded-2xl border border-vv-border-subtle p-2 shadow-2xl shadow-accent/10">
            <div className="rounded-xl bg-vv-base overflow-hidden border border-vv-border shadow-inner">
              {/* Mock Toolbar */}
              <div className="flex items-center justify-between border-b border-vv-border-subtle px-4 py-3 bg-vv-surface">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-vv-border-strong hover:bg-error transition-colors" />
                  <div className="h-3 w-3 rounded-full bg-vv-border-strong hover:bg-warning transition-colors" />
                  <div className="h-3 w-3 rounded-full bg-vv-border-strong hover:bg-success transition-colors" />
                </div>
                <div className="text-xs font-semibold text-vv-secondary flex items-center gap-2">
                  <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  workspace.videoviber.com
                </div>
                <div className="h-6 w-6 rounded-full bg-accent/20 border border-accent/40" />
              </div>

              {/* Mock Editor Body */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-vv-border-subtle h-[300px] md:h-[400px]">
                {/* Sidebar */}
                <div className="hidden md:block bg-vv-base p-4">
                  <div className="mb-4 h-6 w-24 rounded bg-vv-surface" />
                  <div className="space-y-3">
                    {[70, 50, 80, 40].map((w, i) => (
                      <div key={i} className={`h-8 rounded bg-vv-surface transition-colors ${i === 0 ? 'bg-accent/10 border border-accent/20' : ''}`} style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>

                {/* Preview Window (Center) */}
                <div className="col-span-1 md:col-span-2 bg-vv-base/90 relative flex flex-col">
                  {/* Grid Lines */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                  }} />
                  <div className="m-auto flex items-center justify-center h-48 w-full max-w-sm rounded-lg border border-vv-border bg-vv-surface shadow-2xl z-10">
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent mb-3">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span className="text-xs text-vv-muted font-mono">Render Preview</span>
                    </div>
                  </div>
                </div>

                {/* Inspector */}
                <div className="hidden md:block bg-vv-base p-4">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 h-4 w-20 rounded bg-vv-surface" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-10 rounded bg-vv-surface" />
                        <div className="h-10 rounded bg-vv-surface" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 h-4 w-16 rounded bg-vv-surface" />
                      <div className="h-2 rounded-full bg-vv-surface overflow-hidden">
                        <div className="h-full w-2/3 bg-accent rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Timeline */}
              <div className="border-t border-vv-border-subtle bg-vv-base p-4 h-32">
                <div className="mb-3 flex justify-between">
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded bg-vv-surface" />
                    <div className="h-6 w-6 rounded bg-vv-surface" />
                    <div className="h-6 w-6 rounded bg-vv-surface" />
                  </div>
                  <div className="h-6 w-24 rounded bg-vv-surface" />
                </div>
                <div className="relative h-12 rounded bg-vv-surface border border-vv-border overflow-hidden flex gap-0.5 p-0.5">
                  <div className="h-full w-1/4 rounded-sm bg-violet-500/30 border border-violet-500/50" />
                  <div className="h-full w-1/3 rounded-sm bg-blue-500/30 border border-blue-500/50" />
                  <div className="h-full w-auto flex-1 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
                  {/* Playhead */}
                  <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-accent z-10 shadow-[0_0_8px_rgba(124,58,237,0.8)]">
                    <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 rounded bg-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Under Glow */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-20 w-[90%] rounded-full bg-accent/20 blur-[60px]" />
        </div>

        {/* ─── Features Grid ───────────────────────────────── */}
        <section id="features" className="relative mx-auto mt-40 w-full max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-vv-primary">
              Built for <span className="gradient-text">speed and scale</span>
            </h2>
            <p className="mt-4 text-vv-secondary max-w-xl mx-auto">
              Everything you need to produce stunning AI video content without the technical overhead.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="vv-card-glow glass rounded-2xl border border-vv-border-subtle p-6 transition-all duration-300 hover:-translate-y-1 hover:border-vv-border-strong hover:bg-vv-surface"
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-accent ring-1 ring-accent/10`}>
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-vv-primary">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-vv-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Trusted Providers ────────────────────────────── */}
        <section className="mx-auto mt-40 w-full max-w-5xl px-4 text-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-vv-muted">
            Powered by industry-leading models
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale filter transition-all hover:grayscale-0 sm:gap-16">
            {providers.map((p) => (
              <div key={p.name} className="flex items-center gap-3 font-bold text-xl text-vv-primary">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${p.gradient} text-white text-sm`}>
                  {p.letter}
                </div>
                {p.name}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Bottom CTA ─────────────────────────────────── */}
        <section className="relative mx-auto mt-40 w-full max-w-4xl px-4 pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-vv-surface to-purple-900/10 p-12 text-center shadow-2xl shadow-accent/5">
            {/* Glow */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mask-image-gradient" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-vv-primary mb-6">
                Start creating today
              </h2>
              <p className="text-lg text-vv-secondary mb-10 max-w-xl mx-auto">
                Join creators shaping the future of video production. No credit card required to get started.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup" className="vv-btn-primary rounded-xl px-10 py-4 text-base shadow-lg shadow-accent/20">
                  Create free account
                </Link>
                <Link href="/pricing" className="vv-btn-secondary rounded-xl px-10 py-4 text-base bg-vv-surface/50 backdrop-blur-md">
                  View plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="relative border-t border-vv-border-subtle bg-vv-base z-10">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-lg font-bold tracking-tight text-vv-primary">VideoViber</span>
              </Link>
              <p className="text-sm text-vv-secondary">
                Turn vague creative intent into an editable first cut using AI.
              </p>
              <div className="mt-4 flex gap-4">
                {['Twitter', 'GitHub', 'Discord'].map((social) => (
                  <a key={social} href="#" className="text-vv-muted hover:text-accent transition-colors text-sm">
                    {social}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Links */}
            <div>
              <p className="text-sm font-bold text-vv-primary mb-4">Product</p>
              <ul className="space-y-3">
                {[{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }, { label: 'Changelog', href: '#' }].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-vv-secondary hover:text-accent transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold text-vv-primary mb-4">Company</p>
              <ul className="space-y-3">
                {[{ label: 'About', href: '/about' }, { label: 'Careers', href: '#' }, { label: 'Contact', href: '#' }].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-vv-secondary hover:text-accent transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold text-vv-primary mb-4">Legal</p>
              <ul className="space-y-3">
                {[{ label: 'Privacy Policy', href: '#' }, { label: 'Terms of Service', href: '#' }].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-vv-secondary hover:text-accent transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-vv-border-subtle pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-vv-muted">
              © {new Date().getFullYear()} VideoViber. All rights reserved.
            </p>
            <p className="text-sm text-vv-muted">
              Designed for creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
