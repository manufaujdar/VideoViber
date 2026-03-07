import type { Metadata } from 'next';
import Link from 'next/link';
import { MotionImage } from '@/components/motion-image';
import { pricingFaq, pricingTiers } from '@/features/marketing';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Access model and rollout path for VideoViber, including developer setup and production enablement tracks.',
};

export default function PricingPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-6xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Pro Access</p>
          <h1 className="vv-page-title">
            Pro capability.
            <span className="gradient-text"> At your scale.</span>
          </h1>
          <p className="vv-page-subtitle">
            VideoViber is engineered for demanding production environments. Choose the access tier that reflects your studio&apos;s operational maturity.
          </p>
        </header>

        <div className="vv-card-glow animate-slide-up rounded-3xl overflow-hidden p-0">
          <div className="relative aspect-[16/7]">
            <MotionImage
              src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1900&q=80"
              alt="Cinematic neon skyline"
              fill
              sizes="100vw"
              className="object-cover"
              priority
              motionPreset="pan"
              motionSpeed="slow"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.15),rgba(2,6,14,0.85))]" />
          </div>
          <div className="p-7">
            <p className="text-cyan-200 text-xs uppercase tracking-[0.14em]">Uncompromised Power</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">The ultimate cinematic engine. Now rolling out.</h2>
            <p className="text-vv-secondary mt-3 max-w-3xl text-lg leading-relaxed">
              We focus exclusively on delivering unmatched cinematic generation capabilities. Direct, transparent access paths without the noise. Valid as of March 2026.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article key={tier.name} className="vv-card-hover animate-slide-up delay-200 rounded-2xl p-6">
              <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">{tier.availability}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{tier.name}</h2>
              <p className="text-vv-secondary mt-3 text-base leading-relaxed">{tier.summary}</p>
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

        <section className="vv-card animate-slide-up delay-300 mt-8 rounded-3xl p-7">
          <h2 className="text-2xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-5 space-y-3">
            {pricingFaq.map((item) => (
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
