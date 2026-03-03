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
        <div className="relative min-h-screen bg-vv-base">
            {/* ─── Header ──────────────────────────────────── */}
            <header className="sticky top-0 z-sticky glass border-b border-vv-border-subtle">
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 text-vv-primary transition-opacity hover:opacity-80">
                        <svg className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        <span className="text-lg font-bold tracking-tight">VideoViber</span>
                    </Link>

                    {/* Nav Links */}
                    <ul className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-vv-secondary transition-colors hover:bg-vv-hover hover:text-vv-primary"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-vv-secondary transition-colors hover:text-vv-primary sm:block"
                        >
                            Sign in
                        </Link>
                        <Link href="/signup" className="vv-btn-primary rounded-xl px-5 py-2 text-sm">
                            Get Started
                        </Link>
                    </div>
                </nav>
            </header>

            {/* ─── Content ─────────────────────────────────── */}
            <main>{children}</main>

            {/* ─── Footer ──────────────────────────────────── */}
            <footer className="border-t border-vv-border-subtle bg-vv-surface/50">
                <div className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Brand */}
                        <div className="lg:col-span-2">
                            <Link href="/" className="flex items-center gap-2 text-vv-primary">
                                <svg className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                <span className="text-lg font-bold tracking-tight">VideoViber</span>
                            </Link>
                            <p className="mt-3 max-w-sm text-sm leading-relaxed text-vv-secondary">
                                Agentic spec-driven video workspace. Turn vague creative intent into
                                an editable first cut using multiple AI video providers.
                            </p>
                            <div className="mt-5 flex gap-4">
                                {['Twitter', 'GitHub', 'Discord'].map((social) => (
                                    <a
                                        key={social}
                                        href="#"
                                        className="text-vv-muted transition-colors hover:text-accent"
                                        aria-label={social}
                                    >
                                        <span className="text-sm font-medium">{social}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Link Columns */}
                        {Object.entries(footerLinks).map(([heading, links]) => (
                            <div key={heading}>
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-vv-muted">
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

                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-vv-border-subtle pt-8 sm:flex-row">
                        <p className="text-xs text-vv-muted">
                            © {new Date().getFullYear()} VideoViber. All rights reserved.
                        </p>
                        <p className="text-xs text-vv-muted">
                            Created with ♥ for the creative community
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
