import type { Metadata } from 'next';
import { BrandLogo } from '@/components/brand-logo';
import { MotionImage } from '@/components/motion-image';
import { authSetupChecklist } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Authenticate into VideoViber and continue into the cinematic workspace.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_560px_at_8%_0%,rgba(82,222,255,0.16),transparent_60%),radial-gradient(760px_520px_at_94%_12%,rgba(255,175,103,0.12),transparent_62%),linear-gradient(180deg,#02040a_0%,#040913_55%,#02050a_100%)]" />

      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="vv-card-glow animate-slide-up hidden overflow-hidden rounded-3xl p-0 lg:block">
          <div className="relative aspect-[9/10]">
            <MotionImage
              src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80"
              alt="Cinematic AI-generated abstract visualization"
              fill
              sizes="40vw"
              className="object-cover"
              priority
              motionPreset="drift"
              motionSpeed="slow"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,14,0.25),rgba(3,6,14,0.85))]" />
            <div className="absolute inset-x-6 bottom-6">
              <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">Studio Access</p>
              <h1 className="mt-2 text-2xl font-semibold">Authenticate, configure, and create.</h1>
              <p className="text-vv-secondary mt-3 text-sm leading-relaxed">
                Account routes are wired directly into the production environment. Complete the checklist to initialize your workspace instance.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-vv-secondary">
              Fast Setup Checklist
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {authSetupChecklist.map((item) => (
                <li key={item} className="text-vv-secondary flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-lg flex-col justify-center">
          <BrandLogo href="/" className="mb-6 self-center" />

          <div className="glass-strong animate-scale-in rounded-3xl border border-white/12 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.4)] sm:p-8">
            {children}
          </div>

          <p className="text-vv-muted mt-5 text-center text-xs uppercase tracking-[0.1em]">
            © {new Date().getFullYear()} VideoViber
          </p>
        </section>
      </div>
    </div>
  );
}
