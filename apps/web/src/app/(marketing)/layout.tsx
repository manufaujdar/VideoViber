import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    template: '%s | VideoViber',
    default: 'VideoViber',
  },
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const footerLinks = {
  Product: [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects/new', label: 'New Project' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/careers', label: 'Careers' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/security', label: 'Security' },
  ],
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#03060d] text-vv-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_620px_at_0%_0%,rgba(71,197,255,0.18),transparent_60%),radial-gradient(920px_580px_at_95%_6%,rgba(255,167,103,0.12),transparent_62%),linear-gradient(180deg,#03060d_0%,#050913_45%,#02040a_100%)]" />

      <header className="sticky top-3 z-sticky px-4 md:px-6">
        <nav className="mx-auto mt-3 flex h-[72px] w-full max-w-7xl items-center justify-between rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(8,14,28,0.86),rgba(7,12,22,0.64))] px-4 shadow-[0_20px_55px_rgba(0,0,0,0.42)] backdrop-blur-xl md:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300 shadow-[0_0_28px_rgba(82,222,255,0.7)]" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-vv-primary transition-opacity group-hover:opacity-85 md:text-base">
              VideoViber
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-vv-secondary transition-all hover:bg-white/10 hover:text-vv-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-vv-primary transition-all hover:bg-white/10 sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex rounded-full border border-cyan-200/70 bg-gradient-to-r from-cyan-300 via-cyan-100 to-amber-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#06152b] shadow-[0_12px_30px_rgba(82,222,255,0.24)] transition-transform hover:-translate-y-0.5 md:px-5"
            >
              Enter Studio
            </Link>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(8,14,26,0.78),rgba(5,9,16,0.95))]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300 shadow-[0_0_28px_rgba(82,222,255,0.7)]" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-vv-primary md:text-base">
                  VideoViber
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-relaxed text-vv-secondary">
                Cinematic AI studio for creators who need continuity, visual control, and timeline
                direction from first brief to exported cut.
              </p>

              <div className="mt-6 flex gap-3">
                {[
                  { href: '/blog', label: 'Journal' },
                  { href: '/security', label: 'Security' },
                  { href: '/contact', label: 'Contact' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-vv-secondary transition-colors hover:text-vv-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-vv-muted">
                  {heading}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-vv-secondary transition-colors hover:text-vv-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-xs uppercase tracking-[0.1em] text-vv-muted">
              © {new Date().getFullYear()} VideoViber. All rights reserved.
            </p>
            <p className="text-xs uppercase tracking-[0.1em] text-vv-muted">
              Built as a cinematic creative platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
