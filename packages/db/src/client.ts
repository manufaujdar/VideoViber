import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Database type definitions.
 *
 * TODO: Generate from Supabase CLI with `supabase gen types typescript`
 * after running migrations on a live project. For now, this is a placeholder.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Database {
    public: {
        Tables: Record<string, unknown>;
        Views: Record<string, unknown>;
        Functions: Record<string, unknown>;
        Enums: Record<string, unknown>;
    };
}

/**
 * Create a typed Supabase client for browser-side usage.
 * Uses the anon key — all queries go through RLS.
 */
export function createBrowserClient(
    supabaseUrl: string,
    supabaseAnonKey: string
): SupabaseClient<Database> {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
}

/**
 * Create a typed Supabase client for server-side usage.
 * Uses the service role key — bypasses RLS.
 * NEVER expose this client to the browser.
 */
export function createServerClient(
    supabaseUrl: string,
    serviceRoleKey: string
): SupabaseClient<Database> {
    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
