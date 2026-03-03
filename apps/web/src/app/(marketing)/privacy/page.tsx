import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VideoViber privacy policy and data handling summary.',
};

const sections = [
  {
    title: 'Data We Process',
    body: 'Account details, project metadata, generation status events, and uploaded assets required to operate the workspace.',
  },
  {
    title: 'Why We Process It',
    body: 'To deliver core product workflows, keep sessions secure, and maintain platform reliability and diagnostics.',
  },
  {
    title: 'Provider Requests',
    body: 'When generation is requested, relevant prompt data is sent to the chosen provider according to your selected workflow.',
  },
  {
    title: 'User Controls',
    body: 'You can remove projects and assets, revoke provider usage, and request account-level deletion support through contact channels.',
  },
];

export default function PrivacyPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-4xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Privacy</p>
          <h1 className="vv-page-title">
            Practical privacy terms,
            <span className="gradient-text"> written for builders.</span>
          </h1>
          <p className="vv-page-subtitle">Last updated: March 3, 2026</p>
        </header>

        <div className="space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="vv-card rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
