import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Access model and rollout path for VideoViber, including developer setup and production enablement tracks.',
};

const tiers = [
  {
    name: 'Developer Workspace',
    availability: 'Available now',
    summary:
      'Run the full product locally, configure provider keys, and validate generation flow with your own API accounts.',
    includes: [
      'Full UI workflow from project brief to timeline',
      'Provider diagnostics and environment validation tools',
      'No synthetic billing meters or hidden quota simulation',
      'Best for engineering and internal prototyping',
    ],
    cta: { href: '/settings/keys', label: 'Configure Providers' },
  },
  {
    name: 'Managed Studio Cloud',
    availability: 'Rolling out in phases',
    summary:
      'Hosted production environment with managed reliability, deployment guardrails, and workspace governance.',
    includes: [
      'Centralized team workspace and operational controls',
      'Managed deployment and platform updates',
      'Production support channels and incident visibility',
      'Best for teams shipping client-facing output',
    ],
    cta: { href: '/contact', label: 'Request Access' },
  },
  {
    name: 'Enterprise Program',
    availability: 'By engagement',
    summary:
      'Architecture support, compliance alignment, and deployment strategy for organizations with strict requirements.',
    includes: [
      'Security and governance planning sessions',
      'Integration architecture and migration guidance',
      'Priority escalation path for critical workflows',
      'Best for regulated or high-scale environments',
    ],
    cta: { href: '/contact', label: 'Talk to Team' },
  },
];

const faq = [
  {
    q: 'Where are fixed dollar plans listed?',
    a: 'Public fixed-price tiers are not finalized yet. We currently prioritize transparent capability rollout over placeholder pricing tables.',
  },
  {
    q: 'Can I build with VideoViber today?',
    a: 'Yes. The developer workspace and provider diagnostics are already usable for implementation and internal testing.',
  },
  {
    q: 'Is provider usage billed through VideoViber?',
    a: 'In developer mode, provider usage is billed directly by your selected provider account (BYOK model).',
  },
  {
    q: 'How do teams join managed rollout?',
    a: 'Use the contact page with your workload profile, provider mix, and expected concurrency. We onboard by readiness and fit.',
  },
];

export default function PricingPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-6xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Access & Pricing</p>
          <h1 className="vv-page-title">
            Real rollout stages,
            <span className="gradient-text"> no fake plan matrix.</span>
          </h1>
          <p className="vv-page-subtitle">
            Pricing and access are documented by operational maturity so developers can choose the
            right path without guessing what is production-ready.
          </p>
        </header>

        <div className="vv-card-glow rounded-3xl p-0 overflow-hidden">
          <div className="relative aspect-[16/7]">
            <Image
              src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1900&q=80"
              alt="Cinematic neon skyline"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.15),rgba(2,6,14,0.85))]" />
          </div>
          <div className="p-7">
            <p className="text-cyan-200 text-xs uppercase tracking-[0.14em]">Current Product State</p>
            <h2 className="mt-2 text-xl font-semibold">Developer-first platform with staged cloud rollout</h2>
            <p className="text-vv-secondary mt-3 max-w-3xl text-sm leading-relaxed">
              We intentionally avoid publishing placeholder price points. This page reflects current
              shipping capability and onboarding path as of March 3, 2026.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className="vv-card-hover rounded-2xl p-6">
              <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">{tier.availability}</p>
              <h2 className="mt-2 text-lg font-semibold">{tier.name}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{tier.summary}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {tier.includes.map((item) => (
                  <li key={item} className="text-vv-secondary flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={tier.cta.href} className="vv-btn-secondary mt-5 inline-flex px-4 py-2 text-xs">
                {tier.cta.label}
              </Link>
            </article>
          ))}
        </div>

        <section className="vv-card mt-8 rounded-3xl p-7">
          <h2 className="text-xl font-semibold">Questions</h2>
          <div className="mt-5 space-y-3">
            {faq.map((item) => (
              <details key={item.q} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">{item.q}</summary>
                <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
