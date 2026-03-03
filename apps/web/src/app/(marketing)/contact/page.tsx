import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the VideoViber team for sales, partnerships, or support.',
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="border-vv-border-subtle bg-vv-surface/70 rounded-2xl border p-8 sm:p-10">
        <h1 className="text-vv-primary text-3xl font-bold">Contact</h1>
        <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
          Reach out for enterprise onboarding, product questions, or partnership opportunities.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="border-vv-border bg-vv-base/70 rounded-xl border p-4">
            <p className="text-vv-muted text-xs font-semibold uppercase tracking-wider">Sales</p>
            <a
              href="mailto:sales@videoviber.com"
              className="text-accent hover:text-accent-hover mt-2 inline-block text-sm font-semibold"
            >
              sales@videoviber.com
            </a>
          </div>
          <div className="border-vv-border bg-vv-base/70 rounded-xl border p-4">
            <p className="text-vv-muted text-xs font-semibold uppercase tracking-wider">Support</p>
            <a
              href="mailto:support@videoviber.com"
              className="text-accent hover:text-accent-hover mt-2 inline-block text-sm font-semibold"
            >
              support@videoviber.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
