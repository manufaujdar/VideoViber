import type { Metadata } from 'next';
import Link from 'next/link';
import { MotionImage } from '@/components/motion-image';
import {
  aboutOperatingPrinciples,
  aboutPillars,
  aboutTimeline,
} from '@/features/marketing';

export const metadata: Metadata = {
  title: 'About',
  description:
    'VideoViber mission, product philosophy, and the engineering principles behind the cinematic AI workspace.',
};

export default function AboutPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-6xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">The Philosophy</p>
          <h1 className="vv-page-title">
            Engineered for the
            <span className="gradient-text"> cinematic mind.</span>
          </h1>
          <p className="vv-page-subtitle">
            VideoViber is built for those who demand ultimate visual ambition, uncompromising predictability, and sheer creative control from prototype to final cut.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <article className="vv-card-glow animate-slide-up rounded-3xl overflow-hidden p-0">
            <div className="relative aspect-[16/9]">
              <MotionImage
                src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80"
                alt="Cinematic city skyline with atmospheric lighting"
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority
                motionPreset="pan"
                motionSpeed="slow"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.05),rgba(2,6,14,0.75))]" />
            </div>
            <div className="p-7">
              <h2 className="text-2xl font-semibold tracking-tight">Aesthetic Foundation</h2>
              <p className="text-vv-secondary mt-3 text-base leading-relaxed">
                The interface uses cinematic lighting, massive structural depth, and profound progression cues. Every action feels deliberate, powerful, and definitive.
              </p>
            </div>
          </article>

          <article className="vv-card animate-slide-up delay-100 rounded-3xl p-7 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold tracking-tight">Core Tenets</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {aboutOperatingPrinciples.map((item) => (
                <li key={item} className="text-vv-secondary flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/security" className="vv-btn-secondary px-4 py-2 text-xs">
                Security Posture
              </Link>
              <Link href="/settings/keys" className="vv-btn-secondary px-4 py-2 text-xs">
                Provider Diagnostics
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {aboutPillars.map((pillar) => (
            <article key={pillar.title} className="vv-card-hover animate-slide-up delay-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold tracking-tight">{pillar.title}</h2>
              <p className="text-vv-secondary mt-3 text-base leading-relaxed">{pillar.detail}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="vv-card animate-slide-up delay-300 rounded-3xl p-7">
            <h2 className="text-2xl font-semibold tracking-tight">Evolution Timeline</h2>
            <div className="mt-5 space-y-5">
              {aboutTimeline.map((milestone) => (
                <div key={milestone.title} className="relative pl-5">
                  <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                  <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">{milestone.date}</p>
                  <h3 className="mt-1 text-sm font-semibold">{milestone.title}</h3>
                  <p className="text-vv-secondary mt-2 text-sm leading-relaxed">{milestone.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="vv-card-glow animate-slide-up delay-400 rounded-3xl overflow-hidden p-0">
            <div className="relative aspect-[16/10]">
              <MotionImage
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"
                alt="Creative studio desk with monitors"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                motionPreset="drift"
                motionSpeed="medium"
                motionDelayMs={220}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,18,0.15),rgba(4,8,18,0.78))]" />
            </div>
            <div className="p-7">
              <h2 className="text-2xl font-semibold tracking-tight">Built for Studios</h2>
              <p className="text-vv-secondary mt-3 text-base leading-relaxed">
                Routes are structured for ultimate separation of concerns. State is rigorously centralized. Every architecture decision designed for absolute performance and seamless integration.
              </p>
              <Link href="/blog" className="vv-btn-secondary mt-5 inline-flex px-4 py-2 text-xs">
                Engineering Notes
              </Link>
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}
