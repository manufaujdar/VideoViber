'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  authConfigMessages,
  getExistingSession,
  signInWithOAuth,
  signInWithPassword,
} from '@/features/auth';
import { isSupabaseConfigured } from '@/lib/supabase-browser';

const configMessage = authConfigMessages.login;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await getExistingSession();
      if (session.ok && session.data.hasSession) {
        router.replace('/dashboard');
      }
    })();
  }, [router]);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null);
    const result = await signInWithOAuth(provider, configMessage);
    if (!result.ok) {
      setError(result.error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // [ADMIN BYPASS] Temporary local development bypass
    if (email === 'admin@admin.com' && password === 'admin') {
      document.cookie = 'admin_bypass=true; path=/; max-age=86400; SameSite=Strict';
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    const result = await signInWithPassword({
      email,
      password,
    }, configMessage);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">Studio Access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Access Studio</h1>
        <p className="text-vv-secondary mt-2 text-sm">Authenticate to resume production.</p>
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

      <div className="space-y-3">
        <button
          type="button"
          disabled={!isSupabaseConfigured || loading}
          onClick={() => void handleOAuthSignIn('google')}
          className="vv-btn-secondary w-full justify-center rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue with Google
        </button>
        <button
          type="button"
          disabled={!isSupabaseConfigured || loading}
          onClick={() => void handleOAuthSignIn('github')}
          className="vv-btn-secondary w-full justify-center rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue with GitHub
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-vv-muted text-xs uppercase tracking-[0.1em]">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="vv-label mb-1.5 block">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="vv-input w-full"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="vv-label">
              Password
            </label>
            <Link href="/forgot-password" className="text-cyan-200 text-xs font-semibold hover:text-cyan-100">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="vv-input w-full pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-vv-muted hover:text-vv-primary absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="vv-btn-primary w-full justify-center rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-vv-secondary mt-6 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-cyan-200 font-semibold hover:text-cyan-100">
          Create one
        </Link>
      </p>
    </>
  );
}
