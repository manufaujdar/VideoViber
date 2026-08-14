# Technical overview

Status: private prototype; architecture is more complete than current runtime
and release evidence.

## Runtime and workspace

- Node.js 20.x and pnpm 10.x.
- Turborepo monorepo with TypeScript packages and apps.
- Web app uses Next.js App Router, React, Tailwind, Zustand, TanStack Query,
  React Hook Form, and Zod.
- Supabase provides intended Postgres/Auth/Storage/Realtime boundaries.
- Provider SDK isolates Runway, Veo, and Luma-style adapters.
- Media package reserves FFmpeg and Remotion utilities.
- Scripts cover lint, typecheck, build, tests, formatting, and secret scanning.

## Codebase map

- apps/web: marketing/auth/app routes, wizard, timeline editor, API routes, and state.
- apps/mobile and apps/desktop: future wrapper scaffolds.
- packages/types: enums and Zod schemas for projects, shots, assets, jobs, versions, exports, usage, and billing.
- packages/sdk: provider interface, registry, and adapters.
- packages/agents and packages/prompts: agent interfaces and structured prompts.
- packages/db and packages/media: persistence and media boundaries.
- packages/ui and packages/config: shared components, tokens, and environment validation.
- supabase/: migrations, seed, and edge-function surface.

## Core lifecycle

Vibe brief -> project bible and shot plan -> structured shot specs -> provider
generation jobs -> assets/variants -> non-destructive timeline versions ->
render/export -> usage/billing records.

Use the pinned versions, lockfile, quality scripts, and secret scanner before
deployment. Validate RLS, key encryption, job retries, storage retention,
billing semantics, provider terms, and export recovery. The repository is
private/all rights reserved; do not present this as an open-source release.

