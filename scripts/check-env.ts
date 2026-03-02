import { validateEnv } from '@videoviber/config';

/**
 * Check that all required environment variables are set.
 * Run before dev/build to fail fast on misconfig.
 *
 * Usage: npx tsx scripts/check-env.ts
 */
try {
    validateEnv();
    console.log('✅ Environment variables are valid');
} catch (error) {
    process.exit(1);
}
