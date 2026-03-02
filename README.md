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
│  │  Runway  │  │ Veo (Vertex) │  │   Luma   │   + more      │
│  └──────────┘  └──────────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Prerequisites: Node.js ≥ 18, pnpm ≥ 9

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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| State | Zustand, TanStack Query |
| Forms | React Hook Form, Zod |
| Backend | Supabase Postgres, Auth, Storage, RLS |
| Async Workflows | Trigger.dev / Inngest |
| Media Processing | FFmpeg, Remotion |
| Hosting | Vercel (web), Supabase (backend) |
| Observability | PostHog (analytics), Sentry (errors) |
| Repo Tooling | pnpm, Turbo, ESLint, Prettier, Husky |

---

## V1 Scope

**In scope:** Text prompt → auto shot planner → multi-provider generation → timeline assembly → export rough cut.

**Out of scope:** Native mobile, marketplace, model training, complex billing, voice agents.

See [`docs/prd/mvp-scope.md`](docs/prd/mvp-scope.md) for full details.

---

## Success Metric

**Time from vague idea to editable first cut < 10 minutes.**

---

## License

Private — All rights reserved.
