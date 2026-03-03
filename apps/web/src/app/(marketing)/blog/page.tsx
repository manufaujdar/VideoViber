import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Engineering notes, product decisions, and release updates from VideoViber.',
};

const tracks = [
  {
    title: 'Product Architecture',
    description:
      'How we design the multi-provider planning pipeline, timeline editor behavior, and state transitions.',
    href: '/features',
    cta: 'Explore Features',
  },
  {
    title: 'Security and Reliability',
    description:
      'Operational guardrails, secure defaults, and deployment hardening patterns used in production.',
    href: '/security',
    cta: 'Review Security',
  },
  {
    title: 'Roadmap and Priorities',
    description:
      'What we are building next, what is intentionally deferred, and why each milestone matters.',
    href: '/about',
    cta: 'About The Team',
  },
];

const editorialPolicy = [
  'No synthetic growth metrics or vanity claims.',
  'Every technical article includes trade-offs and constraints.',
  'Release notes include migration impact for developers.',
  'Security-related changes are documented with exact scope.',
];

export default function BlogPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-5xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">VideoViber Journal</p>
          <h1 className="vv-page-title">
            Clear engineering updates,
            <span className="gradient-text"> without marketing noise.</span>
          </h1>
          <p className="vv-page-subtitle">
            We publish implementation decisions, integration notes, and platform updates focused on
            people building and operating the product.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {tracks.map((track) => (
            <article key={track.title} className="vv-card-hover rounded-2xl p-6">
              <h2 className="text-lg font-bold">{track.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{track.description}</p>
              <Link href={track.href} className="vv-btn-secondary mt-5 inline-flex px-4 py-2 text-xs">
                {track.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="vv-card mt-8 rounded-2xl p-8">
          <h2 className="text-xl font-bold">Editorial Standards</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {editorialPolicy.map((item) => (
              <li key={item} className="text-vv-secondary flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
