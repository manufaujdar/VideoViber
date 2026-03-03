import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VideoViber privacy policy and data handling summary.',
};

const sections = [
  {
    title: 'Data We Collect',
    body: 'We collect account details, project metadata, provider configuration metadata, and usage telemetry needed to operate the platform.',
  },
  {
    title: 'How We Use Data',
    body: 'Data is used to provide core functionality, secure accounts, improve reliability, and support product analytics.',
  },
  {
    title: 'Your Controls',
    body: 'You can request account deletion, revoke API keys, and remove uploaded assets from workspace settings.',
  },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="border-vv-border-subtle bg-vv-surface/70 rounded-2xl border p-8 sm:p-10">
        <h1 className="text-vv-primary text-3xl font-bold">Privacy Policy</h1>
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
