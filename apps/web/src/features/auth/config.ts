export const authConfigMessages = {
  login:
    'Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign in.',
  signup:
    'Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable account creation.',
  forgotPassword:
    'Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable password reset.',
} as const;

export const authSetupChecklist = [
  'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  'Use /settings/keys to confirm provider runtime diagnostics.',
  'Create a project and generate shots to validate full flow.',
] as const;
