import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Security posture and controls used by VideoViber.',
};

const controls = [
  {
    title: 'Transport and Browser Security',
    description: 'HTTPS, HSTS, and strict security headers are enabled by default for all routes.',
  },
  {
    title: 'Access Segmentation',
    description: 'App surfaces are separated by route group with explicit auth and settings boundaries.',
  },
  {
    title: 'Provider Credential Handling',
    description:
      'Runtime diagnostics show which provider keys are configured without exposing secrets in UI.',
  },
  {
    title: 'Operational Observability',
    description: 'Generation and export states are recorded with explicit status transitions for debugging.',
  },
];

const devChecklist = [
  'Set required provider env vars in `.env.local`.',
  'Verify provider diagnostics in `/settings/keys`.',
  'Run `pnpm --filter @videoviber/web lint` before PRs.',
  'Run `pnpm --filter @videoviber/web typecheck` before PRs.',
  'Run `pnpm build:web` to validate deploy parity.',
];

export default function SecurityPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-5xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Security</p>
          <h1 className="vv-page-title">
            Defense-in-depth for creative infrastructure,
            <span className="gradient-text"> not just checkboxes.</span>
          </h1>
          <p className="vv-page-subtitle">
            Security is implemented as system behavior across routing, credentials, and deployment
            workflows.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {controls.map((control) => (
            <article key={control.title} className="vv-card-hover rounded-2xl p-6">
              <h2 className="text-base font-bold">{control.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{control.description}</p>
            </article>
          ))}
        </div>

        <div className="vv-card mt-8 rounded-2xl p-8">
          <h2 className="text-xl font-bold">Developer Security Checklist</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {devChecklist.map((item) => (
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
