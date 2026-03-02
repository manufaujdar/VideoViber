import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* ─── Background Effects ─────────────────────────── */}
      <div className="pointer-events-none fixed inset-0">
        {/* Top-left accent glow */}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px] animate-glow-pulse" />
        {/* Bottom-right accent glow */}
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/8 blur-[120px] animate-glow-pulse delay-300" />
        {/* Center subtle glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-accent/5 blur-[150px]" />
        {/* Grid pattern */}
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
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-purple-400 shadow-lg shadow-accent/30">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <span className="text-lg font-bold tracking-tight">VideoViber</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-vv-secondary transition-colors hover:text-vv-primary">
              Dashboard
            </Link>
            <Link href="/dashboard" className="vv-btn-primary">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-vv-secondary backdrop-blur-sm">
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Spec-driven video generation
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
          <div className="animate-fade-in-up delay-300 flex items-center justify-center gap-4 opacity-0">
            <Link href="/dashboard" className="vv-btn-primary px-8 py-3.5 text-base">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Creating
            </Link>
            <Link href="#how" className="vv-btn-ghost px-8 py-3.5 text-base">
              How It Works
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="animate-fade-in-up delay-500 mt-16 flex items-center justify-center gap-8 text-xs text-vv-muted opacity-0">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              BYOK — Your keys, your costs
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Multi-provider (Runway, Veo, Luma)
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Non-destructive editing
            </span>
          </div>
        </div>

        {/* ─── How It Works ─────────────────────────────── */}
        <section id="how" className="relative mx-auto mt-32 w-full max-w-6xl px-4 pb-32">
          {/* Section header */}
          <div className="mb-16 text-center">
            <p className="vv-badge bg-accent/10 text-accent mb-4">Workflow</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to your first cut
            </h2>
            <p className="mt-4 text-vv-secondary">
              From creative spark to editable video in minutes, not hours.
            </p>
          </div>

          {/* Step cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Describe Your Vibe',
                desc: 'Enter a creative brief. Upload reference images. Our AI decomposes it into scenes, shots, and a continuity pack.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
                gradient: 'from-violet-500/20 to-purple-500/20',
              },
              {
                step: '02',
                title: 'Generate & Iterate',
                desc: 'Multi-provider generation with variant comparison. Extend, regenerate, edit. Everything is async, versioned, and non-destructive.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
                  </svg>
                ),
                gradient: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                step: '03',
                title: 'Assemble & Export',
                desc: 'Drag shots onto the timeline. Trim, reorder, swap clips. Export an editable rough cut as MP4 or sequence.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                ),
                gradient: 'from-emerald-500/20 to-green-500/20',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`vv-card-hover group relative animate-fade-in-up opacity-0 ${
                  i === 0 ? 'delay-100' : i === 1 ? 'delay-200' : 'delay-300'
                }`}
              >
                {/* Step number */}
                <div className="absolute right-5 top-5 text-4xl font-black text-vv-border-subtle/50 transition-colors group-hover:text-accent/20">
                  {feature.step}
                </div>

                {/* Icon */}
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-accent ring-1 ring-accent/10`}>
                  {feature.icon}
                </div>

                <h3 className="mb-3 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-vv-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 text-center">
            <Link href="/dashboard" className="vv-btn-primary px-10 py-4 text-base">
              Start Your First Project →
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="relative border-t border-white/5 bg-vv-base py-8 text-center text-sm text-vv-muted">
        <p>VideoViber — Spec-driven video workspace</p>
        <p className="mt-1 text-xs text-vv-disabled">Built for creators who iterate fast</p>
      </footer>
    </div>
  );
}
