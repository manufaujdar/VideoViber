import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Features',
    description: 'Explore all VideoViber features — multi-provider AI engine, professional timeline editor, real-time progress, and more.',
};

const heroFeatures = [
    {
        title: 'Multi-Provider AI Engine',
        description: 'Use Gemini, Runway Gen-3, Google Veo, and Luma Dream Machine in the same project. Pick the best model for each shot.',
        icon: (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        gradient: 'from-violet-500/15 to-purple-500/15',
        borderGradient: 'from-violet-500 to-purple-500',
    },
    {
        title: 'Professional Timeline Editor',
        description: 'Multi-track NLE with drag-and-drop, trim, split, and reorder. Keyboard shortcuts for a truly professional workflow.',
        icon: (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 0A1.125 1.125 0 014.5 4.5h15a1.125 1.125 0 011.125 1.125m-17.25 0h17.25M21.75 5.625v12.75m0 0a1.125 1.125 0 01-1.125 1.125m1.125-1.125H6m15.75 0H6m0 0v-1.125" />
            </svg>
        ),
        gradient: 'from-blue-500/15 to-cyan-500/15',
        borderGradient: 'from-blue-500 to-cyan-500',
    },
    {
        title: 'Real-Time Progress Tracking',
        description: 'Live generation progress bars, status filters, and instant notifications. Cancel, retry, or compare any job.',
        icon: (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
        ),
        gradient: 'from-teal-500/15 to-emerald-500/15',
        borderGradient: 'from-teal-500 to-emerald-500',
    },
    {
        title: 'Spec-Driven Workflow',
        description: 'Describe your vision in plain English. VideoViber auto-generates shot lists, prompts, and a complete editing timeline.',
        icon: (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        gradient: 'from-orange-500/15 to-amber-500/15',
        borderGradient: 'from-orange-500 to-amber-500',
    },
    {
        title: 'Asset Management',
        description: 'Upload reference images, mood boards, and style guides. Organize all your creative assets in one place.',
        icon: (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
        ),
        gradient: 'from-pink-500/15 to-rose-500/15',
        borderGradient: 'from-pink-500 to-rose-500',
    },
    {
        title: 'One-Click Export',
        description: 'Export your finished video as MP4 or image sequence. Up to 4K resolution with no watermarks on paid plans.',
        icon: (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        ),
        gradient: 'from-indigo-500/15 to-blue-500/15',
        borderGradient: 'from-indigo-500 to-blue-500',
    },
];

const providerComparison = [
    { provider: 'Gemini (Google)', speed: 'Fast', quality: 'High', styles: 'Versatile', resolution: '1080p', status: 'Available' },
    { provider: 'Runway Gen-3', speed: 'Medium', quality: 'Very High', styles: 'Cinematic', resolution: '4K', status: 'Available' },
    { provider: 'Google Veo', speed: 'Medium', quality: 'Very High', styles: 'Photorealistic', resolution: '4K', status: 'Available' },
    { provider: 'Luma Dream Machine', speed: 'Fast', quality: 'High', styles: 'Creative', resolution: '1080p', status: 'Available' },
];

const workflowSteps = [
    { step: '01', title: 'Write Your Brief', description: 'Describe your video concept in natural language. Be as specific or vague as you like.' },
    { step: '02', title: 'Auto-Generate Shots', description: 'VideoViber creates a shot list with optimized prompts for each AI provider.' },
    { step: '03', title: 'Generate & Compare', description: 'Run generations across providers. Compare variants side by side in real time.' },
    { step: '04', title: 'Edit & Export', description: 'Arrange shots on the timeline, trim, reorder, and export your finished video.' },
];

export default function FeaturesPage() {
    return (
        <div className="relative overflow-hidden">
            {/* ─── Aurora BG ───────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[120px] animate-gradient" />
                <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-[120px] animate-gradient delay-300" />
                <div className="absolute left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/8 blur-[120px] animate-gradient delay-500" />
            </div>

            {/* ─── Hero ────────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-subtle px-4 py-1.5 text-xs font-semibold text-accent mb-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Feature Overview
                </div>
                <h1 className="text-3xl font-bold text-vv-primary sm:text-5xl">
                    Everything you need to{' '}
                    <span className="gradient-text">create</span>
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg text-vv-secondary">
                    Professional-grade AI video tools, unified in one workspace. No switching between apps.
                </p>
            </section>

            {/* ─── Feature Grid ────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pb-24">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {heroFeatures.map((feature) => (
                        <div
                            key={feature.title}
                            className={`group relative overflow-hidden rounded-2xl border border-vv-border-subtle bg-gradient-to-br ${feature.gradient} p-8 transition-all duration-300 hover:border-vv-border-strong hover:-translate-y-1 hover:shadow-xl`}
                        >
                            {/* Gradient border on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.borderGradient} opacity-0 transition-opacity group-hover:opacity-10`} />

                            <div className="relative">
                                <div className="mb-4 inline-flex rounded-xl bg-vv-surface/80 p-3 text-accent shadow-sm">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-vv-primary">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-vv-secondary">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── How It Works ────────────────────────────── */}
            <section className="relative mx-auto max-w-5xl px-6 pb-24">
                <h2 className="mb-4 text-center text-2xl font-bold text-vv-primary">How it works</h2>
                <p className="mx-auto mb-12 max-w-xl text-center text-vv-secondary">
                    From idea to finished video in four simple steps.
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {workflowSteps.map((step) => (
                        <div key={step.step} className="relative rounded-xl border border-vv-border-subtle bg-vv-surface/60 p-6 text-center transition-all hover:border-accent/30">
                            <span className="mb-3 inline-block text-3xl font-extrabold gradient-text">{step.step}</span>
                            <h3 className="text-sm font-bold text-vv-primary">{step.title}</h3>
                            <p className="mt-2 text-xs leading-relaxed text-vv-secondary">{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Provider Comparison ─────────────────────── */}
            <section className="relative mx-auto max-w-5xl px-6 pb-24">
                <h2 className="mb-4 text-center text-2xl font-bold text-vv-primary">Provider comparison</h2>
                <p className="mx-auto mb-10 max-w-xl text-center text-vv-secondary">
                    Choose the right AI provider for each shot. Use them all in the same project.
                </p>
                <div className="overflow-x-auto rounded-xl border border-vv-border-subtle">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-vv-border-subtle bg-vv-surface/80">
                                <th className="px-6 py-4 font-semibold text-vv-primary">Provider</th>
                                <th className="px-6 py-4 font-semibold text-vv-primary">Speed</th>
                                <th className="px-6 py-4 font-semibold text-vv-primary">Quality</th>
                                <th className="px-6 py-4 font-semibold text-vv-primary">Styles</th>
                                <th className="px-6 py-4 font-semibold text-vv-primary">Max Res</th>
                                <th className="px-6 py-4 font-semibold text-vv-primary">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providerComparison.map((p, i) => (
                                <tr key={i} className="border-b border-vv-border-subtle/50 transition-colors hover:bg-vv-hover/50">
                                    <td className="px-6 py-4 font-medium text-vv-primary">{p.provider}</td>
                                    <td className="px-6 py-4 text-vv-secondary">{p.speed}</td>
                                    <td className="px-6 py-4 text-vv-secondary">{p.quality}</td>
                                    <td className="px-6 py-4 text-vv-secondary">{p.styles}</td>
                                    <td className="px-6 py-4 text-vv-secondary">{p.resolution}</td>
                                    <td className="px-6 py-4">
                                        <span className="vv-badge bg-success-muted text-success">{p.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ─── CTA ─────────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pb-24">
                <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-vv-surface to-purple-900/10 p-12 text-center">
                    <h2 className="text-2xl font-bold text-vv-primary sm:text-3xl">
                        Ready to try it?
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-vv-secondary">
                        Create your first AI video in under 10 minutes. No credit card required.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link href="/signup" className="vv-btn-primary rounded-xl px-8 py-3">
                            Start for free
                        </Link>
                        <Link href="/pricing" className="vv-btn-secondary rounded-xl px-8 py-3">
                            View pricing
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
