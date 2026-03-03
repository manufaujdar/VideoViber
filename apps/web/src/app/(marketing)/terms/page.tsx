import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'VideoViber terms and service usage rules.',
};

const sections = [
  {
    title: 'Acceptable Use',
    body: 'Use the platform for lawful content creation. You are responsible for prompts, outputs, and distribution decisions.',
  },
  {
    title: 'Provider Responsibility',
    body: 'Generation APIs are provided through third-party providers. Their terms apply to usage of those services.',
  },
  {
    title: 'Account and Security',
    body: 'You must protect your credentials and API keys. Report unauthorized access immediately to support.',
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="border-vv-border-subtle bg-vv-surface/70 rounded-2xl border p-8 sm:p-10">
        <h1 className="text-vv-primary text-3xl font-bold">Terms of Service</h1>
        <p className="text-vv-secondary mt-3 text-sm">Last updated: March 3, 2026</p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-vv-primary text-base font-semibold">{section.title}</h2>
              <p className="text-vv-secondary mt-2 text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
