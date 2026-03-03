import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Service terms for using VideoViber across local development and managed environments.',
};

const sections = [
  {
    title: 'Service Scope',
    body: 'VideoViber provides planning, generation orchestration, and timeline tooling. Availability of specific generation providers depends on runtime implementation and your environment configuration.',
  },
  {
    title: 'Acceptable Use',
    body: 'Use the platform in compliance with applicable law and provider policy. You are responsible for prompts, generated output, and final distribution decisions.',
  },
  {
    title: 'Provider Dependencies',
    body: 'When you select a provider, relevant request data is sent to that provider. Their terms, usage policies, and billing model apply to that provider interaction.',
  },
  {
    title: 'Credentials and Security',
    body: 'You must protect account credentials and environment secrets. Do not expose keys in client-side code or public repositories.',
  },
  {
    title: 'Developer Environments',
    body: 'Local and staging environments may expose pre-release behaviors. Production safety checks, quotas, and support guarantees can differ by environment.',
  },
  {
    title: 'Operational Changes',
    body: 'We may update architecture, provider support, and UX workflows to improve reliability and security. Material policy updates are reflected with a new effective date.',
  },
];

export default function TermsPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-4xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Legal</p>
          <h1 className="vv-page-title">
            Terms built for real-world usage,
            <span className="gradient-text"> not legal fog.</span>
          </h1>
          <p className="vv-page-subtitle">Effective date: March 3, 2026</p>
        </header>

        <div className="space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="vv-card rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>

        <article className="vv-card mt-8 rounded-2xl p-7">
          <h2 className="text-lg font-semibold">Related Policies</h2>
          <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
            Review companion policies for operational and data handling details.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/privacy" className="vv-btn-secondary px-4 py-2 text-xs">
              Privacy Policy
            </Link>
            <Link href="/security" className="vv-btn-secondary px-4 py-2 text-xs">
              Security Overview
            </Link>
            <Link href="/contact" className="vv-btn-secondary px-4 py-2 text-xs">
              Contact Team
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
