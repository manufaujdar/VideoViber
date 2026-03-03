import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Pricing',
    description: 'Simple, transparent pricing for every creator. Start free and scale as you grow.',
};

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Perfect for exploring AI video creation',
        cta: 'Get Started',
        ctaHref: '/signup',
        featured: false,
        features: [
            '5 generations per month',
            '720p resolution',
            '1 active project',
            'Basic timeline editor',
            'Community support',
            'Watermarked exports',
        ],
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For creators who need professional output',
        cta: 'Start Pro Trial',
        ctaHref: '/signup?plan=pro',
        featured: true,
        features: [
            'Unlimited generations',
            '4K resolution',
            'Unlimited projects',
            'Multi-track timeline',
            'All AI providers (Gemini, Runway, Veo, Luma)',
            'Priority generation queue',
            'No watermarks',
            'Email support',
        ],
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For teams and organizations at scale',
        cta: 'Contact Sales',
        ctaHref: '/contact',
        featured: false,
        features: [
            'Everything in Pro',
            'Custom API limits',
            'Team workspace',
            'SSO / SAML authentication',
            'Custom model fine-tuning',
            'Dedicated account manager',
            'SLA guarantees',
            'On-premise deployment option',
        ],
    },
];

const faqs = [
    {
        q: 'Can I switch plans at any time?',
        a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
    },
    {
        q: 'What AI providers are included?',
        a: 'Free includes access to Gemini. Pro and Enterprise give you access to all providers including Google Veo, Runway Gen-3, Luma Dream Machine, and more as we add them.',
    },
    {
        q: 'Do you offer refunds?',
        a: 'We offer a 14-day money-back guarantee on all paid plans. No questions asked.',
    },
    {
        q: 'What happens when I hit my generation limit?',
        a: 'On the Free plan, you\'ll be prompted to upgrade. We\'ll never charge you unexpectedly. On paid plans, you can purchase additional generation packs.',
    },
    {
        q: 'Can I use generated videos commercially?',
        a: 'Yes. All videos generated on paid plans are yours to use commercially. Free plan videos include a small watermark.',
    },
];

export default function PricingPage() {
    return (
        <div className="relative overflow-hidden">
            {/* ─── Aurora BG ───────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-60 top-0 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[120px] animate-gradient" />
                <div className="absolute -right-40 top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px] animate-gradient delay-300" />
            </div>

            {/* ─── Hero ────────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-subtle px-4 py-1.5 text-xs font-semibold text-accent mb-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Simple pricing
                </div>
                <h1 className="text-3xl font-bold text-vv-primary sm:text-5xl">
                    Plans for every{' '}
                    <span className="gradient-text">creator</span>
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg text-vv-secondary">
                    Start free. Upgrade when you need more power. No hidden fees, no surprises.
                </p>
            </section>

            {/* ─── Pricing Cards ───────────────────────────── */}
            <section className="relative mx-auto max-w-6xl px-6 pb-24">
                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                                plan.featured
                                    ? 'border-accent/40 bg-vv-surface shadow-xl shadow-accent/10'
                                    : 'border-vv-border-subtle bg-vv-surface/80 hover:border-vv-border-strong'
                            }`}
                        >
                            {plan.featured && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold text-white shadow-lg shadow-accent/30">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-vv-primary">{plan.name}</h3>
                            <p className="mt-1 text-sm text-vv-secondary">{plan.description}</p>

                            <div className="my-6 flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-vv-primary">{plan.price}</span>
                                {plan.period && (
                                    <span className="text-sm text-vv-muted">{plan.period}</span>
                                )}
                            </div>

                            <Link
                                href={plan.ctaHref}
                                className={`mb-8 w-full justify-center rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                                    plan.featured
                                        ? 'vv-btn-primary'
                                        : 'vv-btn-secondary'
                                }`}
                            >
                                {plan.cta}
                            </Link>

                            <ul className="flex-1 space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm">
                                        <svg
                                            className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? 'text-accent' : 'text-success'}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                        <span className="text-vv-secondary">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── FAQ ─────────────────────────────────────── */}
            <section className="relative mx-auto max-w-3xl px-6 pb-24">
                <h2 className="mb-10 text-center text-2xl font-bold text-vv-primary">
                    Frequently asked questions
                </h2>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <details
                            key={i}
                            className="group rounded-xl border border-vv-border-subtle bg-vv-surface/60 transition-colors hover:border-vv-border-strong"
                        >
                            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-vv-primary [&::-webkit-details-marker]:hidden">
                                {faq.q}
                                <svg
                                    className="h-4 w-4 shrink-0 text-vv-muted transition-transform group-open:rotate-180"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </summary>
                            <p className="px-6 pb-4 text-sm leading-relaxed text-vv-secondary">{faq.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─────────────────────────────────────── */}
            <section className="relative mx-auto max-w-7xl px-6 pb-24">
                <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-vv-surface to-purple-900/10 p-12 text-center">
                    <h2 className="text-2xl font-bold text-vv-primary sm:text-3xl">
                        Ready to create?
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-vv-secondary">
                        Join thousands of creators using VideoViber to produce professional AI videos in minutes.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link href="/signup" className="vv-btn-primary rounded-xl px-8 py-3">
                            Start for free
                        </Link>
                        <Link href="/features" className="vv-btn-secondary rounded-xl px-8 py-3">
                            Explore features
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
