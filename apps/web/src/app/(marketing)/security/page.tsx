import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Security posture and controls used by VideoViber.',
};

const controls = [
  'Transport security with HTTPS and strict security headers',
  'Row-level access control for user data in Supabase',
  'Provider keys are never rendered back in plain text in the UI',
  'Audit-friendly status tracking for generations and exports',
];

export default function SecurityPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="border-vv-border-subtle bg-vv-surface/70 rounded-2xl border p-8 sm:p-10">
        <h1 className="text-vv-primary text-3xl font-bold">Security</h1>
        <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
          VideoViber is designed with a defense-in-depth approach across infrastructure, access
          control, and operational monitoring.
        </p>

        <ul className="mt-8 space-y-3">
          {controls.map((control) => (
            <li
              key={control}
              className="border-vv-border bg-vv-base/70 text-vv-secondary flex items-start gap-3 rounded-lg border p-3 text-sm"
            >
              <span className="bg-success mt-1 h-2 w-2 rounded-full" />
              {control}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
