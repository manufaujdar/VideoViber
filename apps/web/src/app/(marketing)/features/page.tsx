import type { Metadata } from 'next';
import Link from 'next/link';
import { MotionImage } from '@/components/motion-image';
import { featureFlow, featureTracks } from '@/features/marketing';
import { providerCatalog } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Cinematic workflow capabilities across planning, generation, timeline direction, and provider orchestration.',
};

export default function FeaturesPage() {
  return (
    <section className="vv-page-shell">
      <div className="vv-page-content max-w-6xl">
        <header className="vv-page-hero">
          <p className="vv-page-eyebrow">Pro Capabilities</p>
          <h1 className="vv-page-title">
            Absolute creation.
            <span className="gradient-text"> Zero friction.</span>
          </h1>
          <p className="vv-page-subtitle">
            VideoViber orchestrates every phase of the cinematic process. From conceptual spark to pristine final cut, in one seamless environment.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="vv-card-glow animate-slide-up rounded-3xl overflow-hidden p-0">
            <div className="relative aspect-[16/9]">
              <MotionImage
                src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=80"
                alt="Futuristic cinematic cityscape"
                fill
                sizes="(max-width: 1024px) 100vw, 64vw"
                className="object-cover"
                priority
                motionPreset="pan"
                motionSpeed="slow"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,5,12,0.08),rgba(1,5,12,0.78))]" />
            </div>
            <div className="p-7">
              <h2 className="text-2xl font-semibold tracking-tight">Command Center</h2>
              <p className="text-vv-secondary mt-3 text-base leading-relaxed">
                Total situational awareness. Your timeline, provider selection, and shot state are instantly accessible, giving you uncompromising control over the final product.
              </p>
            </div>
          </article>

          <article className="vv-card animate-slide-up delay-100 rounded-3xl p-7 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold tracking-tight">Complete Pipeline</h2>
            <div className="mt-4 space-y-4">
              {featureFlow.map((item) => (
                <div key={item.step} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-cyan-200 text-xs font-semibold tracking-[0.12em]">STEP {item.step}</p>
                  <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                  <p className="text-vv-secondary mt-2 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {featureTracks.map((feature) => (
            <article key={feature.title} className="vv-card-hover animate-slide-up delay-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold">{feature.title}</h2>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">{feature.detail}</p>
              <p className="text-cyan-200 mt-4 text-xs uppercase tracking-[0.12em]">{feature.metric}</p>
            </article>
          ))}
        </div>

        <section className="vv-card animate-slide-up delay-300 mt-8 rounded-3xl p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Engine Integration</h2>
              <p className="text-vv-secondary mt-2 text-base leading-relaxed">
                Current provider catalog is exposed directly in code and reflected in runtime diagnostics. The ultimate transparent architecture.
              </p>
            </div>
            <Link href="/settings/keys" className="vv-btn-secondary px-4 py-2 text-xs">
              Open Diagnostics
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-vv-muted">
                  <th className="pb-3 pr-3 font-semibold">Provider</th>
                  <th className="pb-3 pr-3 font-semibold">Role</th>
                  <th className="pb-3 pr-3 font-semibold">Required Env Vars</th>
                  <th className="pb-3 font-semibold">Docs</th>
                </tr>
              </thead>
              <tbody>
                {providerCatalog.map((provider) => (
                  <tr key={provider.id} className="border-b border-white/5 align-top">
                    <td className="py-3 pr-3">
                      <span className="font-semibold">{provider.name}</span>
                    </td>
                    <td className="text-vv-secondary py-3 pr-3">{provider.description}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {provider.envVars.map((envVar) => (
                          <span
                            key={envVar}
                            className="rounded-md border border-white/10 px-2 py-1 font-mono text-xs"
                          >
                            {envVar}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-200 hover:text-cyan-100 text-xs font-semibold uppercase tracking-[0.08em]"
                      >
                        Docs
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
