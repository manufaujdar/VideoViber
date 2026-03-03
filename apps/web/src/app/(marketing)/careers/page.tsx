import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Build the VideoViber platform with us.',
};

const focusAreas = [
  {
    title: 'Platform Engineering',
    detail: 'Next.js architecture, API reliability, and deployment automation across environments.',
  },
  {
    title: 'AI Systems',
    detail: 'Provider integration quality, orchestration logic, and prompt-to-shot planning pipelines.',
  },
  {
    title: 'Product Experience',
    detail: 'Timeline interaction design, creative workflow UX, and frontend performance engineering.',
  },
  {
    title: 'Security & Ops',
    detail: 'Key management, observability, incident workflows, and production hardening practices.',
  },
];

export default function CareersPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-5xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Careers</p>
          <h1 className="vv-page-title">
            Build the cinematic AI stack
            <span className="gradient-text"> behind VideoViber.</span>
          </h1>
          <p className="vv-page-subtitle">
            We hire builders who care about product quality, technical rigor, and shipping useful
            systems for creators.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {focusAreas.map((area) => (
            <article key={area.title} className="vv-card-hover rounded-2xl p-6">
              <h2 className="text-lg font-bold">{area.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{area.detail}</p>
            </article>
          ))}
        </div>

        <div className="vv-card mt-8 rounded-2xl p-8">
          <h2 className="text-xl font-bold">Current Hiring Status</h2>
          <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
            We are not publicly listing open roles right now. If your background strongly matches
            the focus areas above, send a concise profile to
            <a className="text-accent hover:text-accent-hover ml-1 font-semibold" href="mailto:careers@videoviber.com">
              careers@videoviber.com
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/about" className="vv-btn-secondary px-5 py-2 text-xs">
              Team and Mission
            </Link>
            <Link href="/features" className="vv-btn-secondary px-5 py-2 text-xs">
              Product Context
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
