'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
        setSent(true);
    };

    return (
        <>
            <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted">
                    <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-vv-primary">
                    {sent ? 'Check your email' : 'Reset password'}
                </h1>
                <p className="mt-1 text-sm text-vv-secondary">
                    {sent
                        ? `We sent a reset link to ${email}`
                        : 'Enter your email and we\'ll send you a reset link'}
                </p>
            </div>

            {sent ? (
                <div className="space-y-4">
                    <div className="rounded-xl border border-success/20 bg-success-muted p-4 text-center">
                        <p className="text-sm text-success">
                            ✓ Reset link sent. Check your inbox and spam folder.
                        </p>
                    </div>
                    <button
                        onClick={() => { setSent(false); setEmail(''); }}
                        className="vv-btn-secondary w-full justify-center rounded-xl py-3"
                    >
                        Send another link
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reset-email" className="vv-label mb-1.5 block">Email</label>
                        <input
                            id="reset-email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="vv-input w-full"
                            autoComplete="email"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="vv-btn-primary w-full justify-center rounded-xl py-3 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending…
                            </span>
                        ) : (
                            'Send reset link'
                        )}
                    </button>
                </form>
            )}

            {/* ─── Back to Login ─────────────────────────── */}
            <p className="mt-6 text-center text-sm text-vv-secondary">
                <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-hover transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to sign in
                </Link>
            </p>
        </>
    );
}
