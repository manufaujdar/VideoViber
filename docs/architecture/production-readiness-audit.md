# Production Readiness Audit

Last updated: March 3, 2026

## Critical Surfaces and Current Status

| Surface / Directory             | Purpose                                                                     | Status                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `apps/web/src/app/(marketing)`  | Public acquisition site + trust pages                                       | Active (home, features, pricing, about, legal pages present)                |
| `apps/web/src/app/(app)`        | Core product workspace (dashboard, projects, assets, timeline, generations) | Active                                                                      |
| `apps/web/src/app/(auth)`       | Auth entry points                                                           | UI scaffold active, provider wiring pending                                 |
| `apps/web/src/app/api/generate` | Server planning/generation gateway                                          | Hardened input validation and health checks; Gemini implemented             |
| `packages/sdk`                  | Provider abstraction layer                                                  | Interface complete, non-Gemini adapters still pending server implementation |
| `packages/db`                   | Typed Supabase clients                                                      | Client factory present, generated DB types still pending                    |
| `supabase/migrations`           | Core relational schema + RLS                                                | Strong base schema present                                                  |
| `supabase/functions`            | Webhooks and async provider callbacks                                       | Directory present, runtime functions pending                                |

## Framework and Integration Check

- Next.js App Router with route groups is correctly structured for marketing/app/auth split.
- Zustand persistence is currently used as the runtime data source for workspace state.
- Tailwind design tokens and shared utility classes are consistently applied.
- Supabase schema is production-shaped, but frontend is not fully wired to persisted backend entities yet.

## Imports and Dependencies That Are Operationally Important

- `@videoviber/types`: shared provider and entity enums/types used by API and UI.
- `zod`: request validation guardrails for API inputs.
- `sonner`: user-facing async feedback in long-running flows.
- `@supabase/supabase-js`: required for production persistence/auth wiring.
- `@dnd-kit/*`: available for advanced timeline interactions; currently underutilized.

## Remaining High-Priority Work (Post-Current Sprint)

1. Replace client-only project state with Supabase-backed project, shot, and generation records.
2. Implement provider adapters for Runway, Veo, and Luma on server endpoints.
3. Add async job orchestration (Trigger.dev or Inngest) for real generation lifecycles.
4. Wire auth pages to Supabase Auth with session-aware route protection.
5. Add full observability (Sentry, PostHog) and error boundaries for all critical routes.
6. Add integration and e2e tests for project creation, generation pipeline, and export pipeline.
