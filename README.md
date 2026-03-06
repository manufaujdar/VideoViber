# VideoViber

> **Agentic spec-driven video workspace** — from vague creative intent to an editable first cut.

VideoViber is not a thin wrapper around one video provider. It's a **structured workspace** that converts a creative brief into a scene breakdown, shot list, and assembled timeline using multiple AI video generation providers.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Next.js App Router (apps/web)              │  │
│  │  Landing · Dashboard · Workspace · Timeline · Settings  │  │
│  └────────────────────┬───────────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────────┘
                        │ Supabase SDK
┌───────────────────────▼──────────────────────────────────────┐
│                      Supabase                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Postgres │  │   Auth   │  │ Storage  │  │  Edge Fns    │  │
│  │ + RLS    │  │          │  │ (Assets) │  │  (Webhooks)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                    Async Workers                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Trigger.dev / Inngest                                │    │
│  │  • Shot Planner Agent    • Render Agent               │    │
│  │  • Continuity Memory     • QA Agent                   │    │
│  │  • Edit Agent            • Export Pipeline             │    │
│  └──────────────┬───────────────────────────────────────┘    │
└─────────────────┼────────────────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────────────────┐
│              Provider Abstraction Layer                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐               │
│  │  Runway  │  │ Veo (Gemini) │  │   Luma   │   + more      │
│  └──────────┘  └──────────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Prerequisites: Node.js 20.x, pnpm 10.x

# 1. Clone and install
git clone https://github.com/your-org/VideoViber.git
cd VideoViber
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run dev server
pnpm dev

# Open http://localhost:3000
```

If you see runtime chunk errors such as `Cannot find module './46.js'`, clear stale Next artifacts and restart a single dev server:

```bash
pnpm --filter @videoviber/web dev:reset
```

---

## Repo Structure

```
VideoViber/
├── apps/
│   └── web/                  # Next.js App Router frontend
├── packages/
│   ├── ui/                   # Design tokens & shared components
│   ├── config/               # Shared TS config, env validation
│   ├── types/                # Entity types & Zod schemas
│   ├── prompts/              # Structured prompt templates
│   ├── agents/               # Runtime agent interfaces
│   ├── sdk/                  # Provider abstraction layer
│   ├── db/                   # Supabase client & typed helpers
│   └── media/                # FFmpeg & Remotion utilities
├── docs/
│   ├── prd/                  # Product requirements
│   ├── architecture/         # System design docs
│   └── ux/                   # Design principles
├── supabase/
│   ├── migrations/           # Postgres schema
│   ├── functions/            # Edge functions
│   └── seed/                 # Seed data
├── scripts/                  # Dev & build utilities
└── .github/workflows/        # CI pipeline
```

---

## Deployment (Vercel)

This repo includes deployment config at:

- App config: [`apps/web/vercel.json`](apps/web/vercel.json)
- Root config (for monorepo root builds): [`vercel.json`](vercel.json)

Vercel project settings:

- Root Directory: `apps/web` (recommended)
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: `.next`

If you deploy from monorepo root instead:

- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @videoviber/web build`
- Output Directory: `apps/web/.next`

Required production env for Gemini + Veo generation:

- `GEMINI_API_KEY` or `GOOGLE_API_KEY` (or `GOOGLE_GENAI_API_KEY`)
- `GEMINI_VEO_MODEL` (optional, default `veo-3.1-generate-preview`)

Important runtime requirement:

- A key can be syntactically valid but still fail generation when quota/billing or model access is missing (typically `429 RESOURCE_EXHAUSTED` or `403 PERMISSION_DENIED`).
- Use `/api/generate?diagnostics=deep` and `/settings/keys` to verify key validity + Veo model support before testing generation.

Recommended CLI flow:

```bash
npx vercel@latest login
npx vercel@latest link
npx vercel@latest pull --yes --environment=production
npx vercel@latest build --prod
npx vercel@latest deploy --prebuilt --prod
```

Provider runtime diagnostics are available at `/settings/keys` in the app. It reads `/api/generate`
health status and shows which providers are implemented/configured from server env vars.

---

## Tech Stack

| Layer            | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Frontend         | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| State            | Zustand, TanStack Query                                        |
| Forms            | React Hook Form, Zod                                           |
| Backend          | Supabase Postgres, Auth, Storage, RLS                          |
| Async Workflows  | Trigger.dev / Inngest                                          |
| Media Processing | FFmpeg, Remotion                                               |
| Hosting          | Vercel (web), Supabase (backend)                               |
| Observability    | PostHog (analytics), Sentry (errors)                           |
| Repo Tooling     | pnpm, Turbo, ESLint, Prettier, Husky                           |

---

## V1 Scope

**In scope:** Text prompt → auto shot planner → multi-provider generation → timeline assembly → export rough cut.

**Out of scope:** Native mobile, marketplace, model training, complex billing, voice agents.

See [`docs/prd/mvp-scope.md`](docs/prd/mvp-scope.md) for full details.

---

## Cross-Platform Foundation

This repo now includes a lightweight foundation for future mobile and desktop wrappers without changing current web deployment flow.

- Architecture note: [`docs/architecture/cross-platform-foundation.md`](docs/architecture/cross-platform-foundation.md)
- Mobile scaffold: `apps/mobile/`
- Desktop scaffold: `apps/desktop/`

---

## Success Metric

**Time from vague idea to editable first cut < 10 minutes.**

---

## License

Private — All rights reserved.
