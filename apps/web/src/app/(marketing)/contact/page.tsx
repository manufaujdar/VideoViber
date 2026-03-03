import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the VideoViber team for sales, partnerships, or support.',
};

const channels = [
  {
    title: 'Sales and Partnerships',
    email: 'sales@videoviber.com',
    description: 'Enterprise onboarding, procurement, and strategic partnership requests.',
  },
  {
    title: 'Technical Support',
    email: 'support@videoviber.com',
    description: 'Platform issues, account access, and generation workflow troubleshooting.',
  },
  {
    title: 'Security Reports',
    email: 'security@videoviber.com',
    description: 'Responsible disclosure for vulnerabilities and incident communication.',
  },
];

export default function ContactPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-5xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Contact</p>
          <h1 className="vv-page-title">
            Reach the right team,
            <span className="gradient-text"> quickly and directly.</span>
          </h1>
          <p className="vv-page-subtitle">
            Use the dedicated channels below so your request lands with the team that can act on it
            immediately.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {channels.map((channel) => (
            <article key={channel.title} className="vv-card-hover rounded-2xl p-6">
              <h2 className="text-base font-bold">{channel.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{channel.description}</p>
              <a
                href={`mailto:${channel.email}`}
                className="text-accent hover:text-accent-hover mt-4 inline-block text-sm font-semibold"
              >
                {channel.email}
              </a>
            </article>
          ))}
        </div>

        <div className="vv-card mt-8 rounded-2xl p-8">
          <h2 className="text-xl font-bold">Response Expectations</h2>
          <ul className="text-vv-secondary mt-4 space-y-2 text-sm leading-relaxed">
            <li>Sales inquiries: usually within 2 business days.</li>
            <li>Support requests: usually within 1 business day.</li>
            <li>Security reports: acknowledged as soon as possible.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
