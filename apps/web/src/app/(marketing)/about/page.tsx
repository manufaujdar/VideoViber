import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About',
    description: 'Learn about VideoViber — the agentic spec-driven video workspace built for the future of creative production.',
};

const values = [
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
        ),
        title: 'AI-First Creative',
        description: 'We believe AI should amplify human creativity, not replace it. Every feature is designed to keep creators in control.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        title: 'Speed Without Compromise',
        description: 'Go from creative brief to editable first cut in under 10 minutes. Professional quality, startup speed.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
            </svg>
        ),
        title: 'Provider Agnostic',
        description: 'Use the best AI model for each shot. Switch between Gemini, Runway, Veo, and Luma seamlessly.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        title: 'Trust & Transparency',
        description: 'Open pricing, no vendor lock-in, full ownership of your generated content. Your data is yours.',
    },
];

const techStack = [
    { name: 'Next.js 14', category: 'Framework' },
    { name: 'React 18', category: 'UI Library' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Supabase', category: 'Backend' },
    { name: 'Zustand', category: 'State' },
    { name: 'Framer Motion', category: 'Animation' },
    { name: 'Turborepo', category: 'Build' },
    { name: 'Vercel', category: 'Hosting' },
    { name: 'Gemini API', category: 'AI Provider' },
    { name: 'Runway API', category: 'AI Provider' },
    { name: 'Luma API', category: 'AI Provider' },
];

const milestones = [
    { date: 'Q4 2025', title: 'MVP Launch', description: 'Core video generation and timeline editing.' },
    { date: 'Q1 2026', title: 'Multi-Provider Engine', description: 'Added Gemini, Runway, Veo, and Luma support.' },
    { date: 'Q2 2026', title: 'Team Workspaces', description: 'Collaborative editing and shared projects.' },
    { date: 'Q3 2026', title: 'Custom Models', description: 'Fine-tune AI models on your brand assets.' },
];

export default function AboutPage() {
    return (
        <div className="relative overflow-hidden">
            {/* ─── Aurora BG ───────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-gradient" />
                <div className="absolute -right-40 top-1/2 h-[500px] w-[500px] rounded-full bg-fuchsia-600/8 blur-[120px] animate-gradient delay-500" />
            </div>

            {/* ─── Hero ────────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-subtle px-4 py-1.5 text-xs font-semibold text-accent mb-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    About VideoViber
                </div>
                <h1 className="text-3xl font-bold text-vv-primary sm:text-5xl">
                    The future of{' '}
                    <span className="gradient-text">video creation</span>
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-vv-secondary">
                    VideoViber is an agentic, spec-driven video workspace that transforms vague creative
                    intent into editable first cuts using multiple AI video providers — all in one unified timeline.
                </p>
            </section>

            {/* ─── Mission ─────────────────────────────────── */}
            <section className="relative mx-auto max-w-4xl px-6 pb-24">
                <div className="rounded-2xl border border-vv-border-subtle bg-vv-surface/60 p-10 text-center">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-accent">Our Mission</h2>
                    <p className="mt-4 text-xl font-medium leading-relaxed text-vv-primary">
                        &ldquo;Make professional video creation accessible to every creator,
                        regardless of budget or technical skill, by combining the best AI
                        models with intuitive editing tools.&rdquo;
                    </p>
                </div>
            </section>

            {/* ─── Values ──────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pb-24">
                <h2 className="mb-10 text-center text-2xl font-bold text-vv-primary">What drives us</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {values.map((val) => (
                        <div
                            key={val.title}
                            className="vv-card-hover rounded-2xl p-6 text-center"
                        >
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted text-accent">
                                {val.icon}
                            </div>
                            <h3 className="text-base font-bold text-vv-primary">{val.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-vv-secondary">{val.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Timeline ────────────────────────────────── */}
            <section className="relative mx-auto max-w-3xl px-6 pb-24">
                <h2 className="mb-10 text-center text-2xl font-bold text-vv-primary">Our journey</h2>
                <div className="relative">
                    <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-accent via-accent/50 to-transparent" />
                    <div className="space-y-8">
                        {milestones.map((m, i) => (
                            <div key={i} className="relative pl-12">
                                <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-vv-base" />
                                <span className="text-xs font-bold uppercase tracking-wider text-accent">{m.date}</span>
                                <h3 className="mt-1 text-base font-bold text-vv-primary">{m.title}</h3>
                                <p className="mt-1 text-sm text-vv-secondary">{m.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Tech Stack ──────────────────────────────── */}
            <section className="relative mx-auto max-w-5xl px-6 pb-24">
                <h2 className="mb-10 text-center text-2xl font-bold text-vv-primary">Built with</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {techStack.map((tech) => (
                        <div
                            key={tech.name}
                            className="group flex items-center gap-3 rounded-xl border border-vv-border-subtle bg-vv-surface/60 px-4 py-3 transition-all hover:border-accent/30 hover:bg-vv-elevated"
                        >
                            <div className="h-2 w-2 rounded-full bg-accent/60 group-hover:bg-accent transition-colors" />
                            <div>
                                <p className="text-sm font-semibold text-vv-primary">{tech.name}</p>
                                <p className="text-xs text-vv-muted">{tech.category}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─────────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pb-24">
                <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-vv-surface to-purple-900/10 p-12 text-center">
                    <h2 className="text-2xl font-bold text-vv-primary sm:text-3xl">
                        Join the creative revolution
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-vv-secondary">
                        Start creating stunning AI-powered videos today. No credit card required.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link href="/signup" className="vv-btn-primary rounded-xl px-8 py-3">
                            Get started free
                        </Link>
                        <Link href="/features" className="vv-btn-secondary rounded-xl px-8 py-3">
                            See features
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
