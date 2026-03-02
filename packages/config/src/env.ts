import { z } from 'zod';

/**
 * Environment variable schema.
 * Validated at app startup to fail fast on misconfiguration.
 */
export const envSchema = z.object({
    // ─── Supabase ───────────────────────────────────────
    NEXT_PUBLIC_SUPABASE_URL: z
        .string()
        .url()
        .describe('Supabase project URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
        .string()
        .min(1)
        .describe('Supabase anonymous key'),
    SUPABASE_SERVICE_ROLE_KEY: z
        .string()
        .min(1)
        .optional()
        .describe('Supabase service role key (server-only)'),

    // ─── Auth ───────────────────────────────────────────
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    NEXTAUTH_URL: z.string().url().optional(),

    // ─── Observability ──────────────────────────────────
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    SENTRY_DSN: z.string().optional(),

    // ─── App ────────────────────────────────────────────
    NEXT_PUBLIC_APP_URL: z
        .string()
        .url()
        .default('http://localhost:3000'),
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables. Call once at app startup.
 * Throws with descriptive errors on missing/invalid vars.
 */
export function validateEnv(env: Record<string, string | undefined> = process.env): Env {
    const result = envSchema.safeParse(env);
    if (!result.success) {
        const formatted = result.error.format();
        console.error('❌ Environment validation failed:');
        console.error(JSON.stringify(formatted, null, 2));
        throw new Error('Invalid environment variables. See above for details.');
    }
    return result.data;
}
