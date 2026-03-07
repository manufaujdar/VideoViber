# System Overview

Related frontend structure document:
- `docs/architecture/frontend-architecture-v2.md`

## High-Level Architecture

VideoViber follows a **three-tier architecture** with clear separation between frontend, backend (Supabase), and async workers.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│                                                                 │
│  Next.js App Router (Vercel)                                    │
│  ├── React Server Components (data fetching)                    │
│  ├── Client Components (interactivity)                          │
│  ├── Zustand (client state)                                     │
│  ├── TanStack Query (server state + real-time)                  │
│  └── React Hook Form + Zod (forms + validation)                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Supabase JS SDK
                      │ (REST + Realtime WebSocket)
┌─────────────────────▼───────────────────────────────────────────┐
│                      BACKEND TIER                               │
│                                                                 │
│  Supabase Platform                                              │
│  ├── PostgreSQL + RLS (data + authorization)                    │
│  ├── Auth (email, OAuth, session management)                    │
│  ├── Storage (video assets, images, exports)                    │
│  ├── Edge Functions (webhooks, provider callbacks)              │
│  └── Realtime (job status broadcasts)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Database triggers / HTTP
┌─────────────────────▼───────────────────────────────────────────┐
│                     WORKER TIER                                 │
│                                                                 │
│  Trigger.dev / Inngest                                          │
│  ├── Shot Planner Agent (brief → shot specs)                    │
│  ├── Generation Worker (submit to provider, poll status)        │
│  ├── Continuity Memory (cross-shot consistency)                 │
│  ├── Edit Agent (apply timeline patches)                        │
│  ├── Render Agent (FFmpeg stitch/export)                        │
│  └── QA Agent (output quality checks)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Provider SDK calls
┌─────────────────────▼───────────────────────────────────────────┐
│                   PROVIDER LAYER                                │
│                                                                 │
│  Provider Abstraction (packages/sdk)                            │
│  ├── Runway Adapter                                             │
│  ├── Veo (Vertex AI) Adapter                                    │
│  └── Luma Adapter                                               │
│                                                                 │
│  Interface: generateTextToVideo, generateImageToVideo,          │
│             extendVideo, editVideo, upscaleVideo,               │
│             getJobStatus, cancelJob                             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Generation Pipeline

```
Vibe Brief
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ Shot Planner│ ──▶ │ Continuity  │ ──▶ │ Shot Specs   │
│ Agent       │     │ Memory      │     │ (structured) │
└─────────────┘     └─────────────┘     └──────┬───────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │ Generation Queue │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                         ┌────────┐    ┌──────────┐   ┌────────┐
                         │ Runway │    │ Veo      │   │ Luma   │
                         └───┬────┘    └────┬─────┘   └───┬────┘
                             │              │             │
                             ▼              ▼             ▼
                         ┌────────────────────────────────────┐
                         │        Supabase Storage            │
                         │        (completed clips)           │
                         └──────────────┬─────────────────────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  Timeline   │
                                 │  Assembly   │
                                 └──────┬──────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  FFmpeg     │
                                 │  Export     │
                                 └─────────────┘
```

## Deployment Topology

| Component | Platform | Notes |
|-----------|----------|-------|
| `apps/web` | Vercel | Auto-deploy on push to `main` |
| PostgreSQL | Supabase | Managed Postgres with RLS |
| Auth | Supabase Auth | Email + OAuth providers |
| File Storage | Supabase Storage | Video clips, images, exports |
| Edge Functions | Supabase | Webhook handlers, provider callbacks |
| Async Workers | Trigger.dev | Background job processing |
| CDN | Vercel Edge Network | Static assets, ISR pages |
| Analytics | PostHog | Product analytics, feature flags |
| Error Tracking | Sentry | Client + server error capture |

## Key Design Decisions

1. **Supabase over custom backend**: Eliminates need for custom auth, storage, and realtime infra. RLS provides row-level authorization without middleware.

2. **Provider abstraction layer**: All provider interactions go through typed adapters. Product logic never calls provider APIs directly. This allows provider hot-swapping and A/B testing.

3. **Structured specs, not raw prompts**: Every shot has a typed `ShotSpec` with individual fields for camera, motion, continuity, etc. This enables better planning and cross-shot consistency.

4. **Non-destructive editing**: Every edit creates a version. Timeline patches are additive operations on an immutable base. Users can always revert.

5. **BYOK-first**: Users provide their own API keys. Keys are encrypted at rest. No managed billing in V1.

6. **Async-native**: All video generation is asynchronous with explicit state machines. The UI polls via TanStack Query + Supabase Realtime for status updates.
