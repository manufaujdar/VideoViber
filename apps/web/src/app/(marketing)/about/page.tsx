import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description:
    'VideoViber mission, product philosophy, and the engineering principles behind the cinematic AI workspace.',
};

const pillars = [
  {
    title: 'Direction Over Prompt Chaos',
    detail:
      'We design for shot intent, continuity memory, and timeline logic so creators can direct instead of retrying random prompts.',
  },
  {
    title: 'Provider-Agnostic by Default',
    detail:
      'The platform keeps models interchangeable so teams can route each scene to the right engine without refactoring workflows.',
  },
  {
    title: 'Developer-Visible Systems',
    detail:
      'Runtime diagnostics, explicit state transitions, and predictable APIs keep implementation details inspectable in production.',
  },
];

const operatingPrinciples = [
  'No fabricated growth claims or vanity metrics.',
  'No hidden provider lock-in in project state.',
  'No black-box generation flow: status is explicit and traceable.',
  'No fragile UI assumptions across desktop and mobile.',
];

const timeline = [
  {
    date: 'January 2026',
    title: 'Cinematic Homepage System',
    detail:
      'Rebuilt the public shell around atmospheric composition, parallax depth, and mission-driven interaction patterns.',
  },
  {
    date: 'February 2026',
    title: 'Provider Diagnostics Surface',
    detail:
      'Added runtime provider health reporting so developers can verify implementation and environment readiness from UI.',
  },
  {
    date: 'March 2026',
    title: 'Production Workflow Refactor',
    detail:
      'Aligned project planning, generation, and timeline routes with explicit statuses and reduced mock-facing behavior.',
  },
];

export default function AboutPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-6xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">About VideoViber</p>
          <h1 className="vv-page-title">
            Building a cinematic AI workspace,
            <span className="gradient-text"> with engineering rigor.</span>
          </h1>
          <p className="vv-page-subtitle">
            VideoViber is shaped for creators and platform engineers who need visual ambition,
            predictable systems, and tooling that scales from prototype to production.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <article className="vv-card-glow rounded-3xl p-0 overflow-hidden">
            <div className="relative aspect-[16/9]">
              <Image
                src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80"
                alt="Cinematic city skyline with atmospheric lighting"
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.05),rgba(2,6,14,0.75))]" />
            </div>
            <div className="p-7">
              <h2 className="text-xl font-semibold">Design Language</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
                The interface uses cinematic lighting, layered depth, and game-like progression cues
                to make production flow feel deliberate, not mechanical.
              </p>
            </div>
          </article>

          <article className="vv-card rounded-3xl p-7">
            <h2 className="text-xl font-semibold">Operating Principles</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {operatingPrinciples.map((item) => (
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
          {pillars.map((pillar) => (
            <article key={pillar.title} className="vv-card-hover rounded-2xl p-6">
              <h2 className="text-base font-semibold">{pillar.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{pillar.detail}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="vv-card rounded-3xl p-7">
            <h2 className="text-xl font-semibold">Delivery Timeline</h2>
            <div className="mt-5 space-y-5">
              {timeline.map((milestone) => (
                <div key={milestone.title} className="relative pl-5">
                  <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                  <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">{milestone.date}</p>
                  <h3 className="mt-1 text-sm font-semibold">{milestone.title}</h3>
                  <p className="text-vv-secondary mt-2 text-sm leading-relaxed">{milestone.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="vv-card-glow rounded-3xl p-0 overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Image
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"
                alt="Creative studio desk with monitors"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,18,0.15),rgba(4,8,18,0.78))]" />
            </div>
            <div className="p-7">
              <h2 className="text-xl font-semibold">Built for Product Teams</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
                Routes are structured by concern (`(marketing)`, `(auth)`, `(app)`), state is
                centralized with explicit types, and provider behavior is exposed for easy debugging.
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
