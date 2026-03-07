import { buildAuthRedirectUrl } from '@/lib/auth-redirect';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { AuthActionResult, OAuthProvider } from './types';

function authClientOrError(message: string): AuthActionResult<{ client: NonNullable<ReturnType<typeof getSupabaseBrowserClient>> }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { ok: false, error: message };
  }

  return { ok: true, data: { client } };
}

export async function getExistingSession(): Promise<AuthActionResult<{ hasSession: boolean }>> {
  const clientResult = authClientOrError('Supabase auth client is unavailable.');
  if (!clientResult.ok) {
    return clientResult;
  }

  const sessionResult = await clientResult.data.client.auth.getSession();
  if (sessionResult.error) {
    return { ok: false, error: sessionResult.error.message };
  }

  return { ok: true, data: { hasSession: Boolean(sessionResult.data.session) } };
}

export async function signInWithOAuth(
  provider: OAuthProvider,
  configMessage: string
): Promise<AuthActionResult> {
  const clientResult = authClientOrError(configMessage);
  if (!clientResult.ok) {
    return clientResult;
  }

  const response = await clientResult.data.client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: buildAuthRedirectUrl('/dashboard'),
    },
  });

  if (response.error) {
    return { ok: false, error: response.error.message };
  }

  return { ok: true, data: undefined };
}

export async function signInWithPassword(
  params: { email: string; password: string },
  configMessage: string
): Promise<AuthActionResult> {
  const clientResult = authClientOrError(configMessage);
  if (!clientResult.ok) {
    return clientResult;
  }

  const response = await clientResult.data.client.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (response.error) {
    return { ok: false, error: response.error.message };
  }

  return { ok: true, data: undefined };
}

export async function signUpWithPassword(
  params: { name: string; email: string; password: string },
  configMessage: string
): Promise<AuthActionResult<{ hasSession: boolean }>> {
  const clientResult = authClientOrError(configMessage);
  if (!clientResult.ok) {
    return clientResult;
  }

  const response = await clientResult.data.client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.name.trim(),
      },
      emailRedirectTo: buildAuthRedirectUrl('/login'),
    },
  });

  if (response.error) {
    return { ok: false, error: response.error.message };
  }

  return {
    ok: true,
    data: {
      hasSession: Boolean(response.data.session),
    },
  };
}

export async function requestPasswordReset(
  email: string,
  configMessage: string
): Promise<AuthActionResult> {
  const clientResult = authClientOrError(configMessage);
  if (!clientResult.ok) {
    return clientResult;
  }

  const response = await clientResult.data.client.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthRedirectUrl('/login'),
  });

  if (response.error) {
    return { ok: false, error: response.error.message };
  }

  return { ok: true, data: undefined };
}
