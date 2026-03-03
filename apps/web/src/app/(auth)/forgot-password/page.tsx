'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser';

const configMessage =
  'Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable password reset.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(configMessage);
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <>
      <div className="mb-6 text-center">
        <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">Password Recovery</p>
        <h1 className="mt-2 text-2xl font-semibold">{sent ? 'Check your inbox' : 'Reset password'}</h1>
        <p className="text-vv-secondary mt-2 text-sm">
          {sent
            ? `A reset link was sent to ${email}.`
            : 'Enter your account email to receive a secure password reset link.'}
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {configMessage}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {sent ? (
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="vv-btn-secondary w-full justify-center rounded-xl py-3"
        >
          Send another link
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="vv-label mb-1.5 block">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="vv-input w-full"
              autoComplete="email"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="vv-btn-primary w-full justify-center rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-vv-secondary mt-6 text-center text-sm">
        <Link href="/login" className="text-cyan-200 font-semibold hover:text-cyan-100">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
