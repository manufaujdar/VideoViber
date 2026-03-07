export type OAuthProvider = 'google' | 'github';

export type AuthActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
