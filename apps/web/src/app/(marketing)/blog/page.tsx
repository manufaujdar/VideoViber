import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Updates from the VideoViber team.',
};

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="border-vv-border-subtle bg-vv-surface/70 rounded-2xl border p-8 sm:p-10">
        <h1 className="text-vv-primary text-3xl font-bold">Blog</h1>
        <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
          Product updates and technical write-ups are coming soon.
        </p>
        <Link
          href="/features"
          className="vv-btn-secondary mt-6 inline-flex rounded-xl px-5 py-2.5 text-sm"
        >
          Explore Current Features
        </Link>
      </div>
    </section>
  );
}
