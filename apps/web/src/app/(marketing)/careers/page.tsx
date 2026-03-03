import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Career opportunities at VideoViber.',
};

export default function CareersPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="border-vv-border-subtle bg-vv-surface/70 rounded-2xl border p-8 sm:p-10">
        <h1 className="text-vv-primary text-3xl font-bold">Careers</h1>
        <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
          We are building tools for the next generation of creative production. Open roles will be
          posted here.
        </p>
        <Link
          href="/about"
          className="vv-btn-secondary mt-6 inline-flex rounded-xl px-5 py-2.5 text-sm"
        >
          Learn About The Team
        </Link>
      </div>
    </section>
  );
}
