'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  authConfigMessages,
  signInWithOAuth as signInWithOAuthAction,
  signUpWithPassword,
} from '@/features/auth';
import { isSupabaseConfigured } from '@/lib/supabase-browser';

const configMessage = authConfigMessages.signup;

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;
  const canSubmit = useMemo(
    () => Boolean(name.trim() && email.trim() && password.length >= 8 && passwordsMatch && agreed),
    [name, email, password, passwordsMatch, agreed]
  );

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null);
    setNotice(null);

    const result = await signInWithOAuthAction(provider, configMessage);
    if (!result.ok) {
      setError(result.error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    const result = await signUpWithPassword({
      name,
      email,
      password,
    }, configMessage);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (result.data.hasSession) {
      router.push('/dashboard');
      return;
    }

    setNotice('Account created. Check your inbox to verify your email before signing in.');
  };

  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-cyan-200 text-xs uppercase tracking-[0.12em]">Initialize Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Initialize Studio</h1>
        <p className="text-vv-secondary mt-2 text-sm">
          Configure your credentials to enter the production environment.
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

      {notice && (
        <div className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
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
          <label htmlFor="signup-name" className="vv-label mb-1.5 block">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="vv-input w-full"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="vv-label mb-1.5 block">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="vv-input w-full"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="vv-label mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="vv-input w-full pr-12"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-vv-muted hover:text-vv-primary absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="vv-label mb-1.5 block">
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={`vv-input w-full ${confirmPassword && !passwordsMatch ? 'border-red-400/50 focus:border-red-400' : ''}`}
            autoComplete="new-password"
            required
          />
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-300">Passwords do not match.</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
          />
          <span className="text-vv-secondary text-xs leading-relaxed">
            I agree to the{' '}
            <Link href="/terms" className="text-cyan-200 hover:text-cyan-100">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-cyan-200 hover:text-cyan-100">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="vv-btn-primary w-full justify-center rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-vv-secondary mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-cyan-200 font-semibold hover:text-cyan-100">
          Sign in
        </Link>
      </p>
    </>
  );
}
