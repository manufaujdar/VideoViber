import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Account',
    description: 'Sign in or create your VideoViber account.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-vv-base p-4">
            {/* ─── Aurora Background ────────────────────────── */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-gradient" />
                <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px] animate-gradient delay-500" />
                <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[100px] animate-gradient delay-300" />
            </div>

            {/* ─── Grid Dots ───────────────────────────────── */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* ─── Content ─────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <Link
                    href="/"
                    className="mb-8 flex items-center justify-center gap-2 text-vv-primary transition-opacity hover:opacity-80"
                >
                    <svg className="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-xl font-bold tracking-tight">VideoViber</span>
                </Link>

                {/* Auth Card */}
                <div className="glass rounded-2xl border border-vv-border-subtle p-8 shadow-2xl">
                    {children}
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-vv-muted">
                    © {new Date().getFullYear()} VideoViber. All rights reserved.
                </p>
            </div>
        </div>
    );
}
