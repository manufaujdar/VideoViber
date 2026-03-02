# MVP Scope — V1

## In Scope

### Core Features

| Feature | Description |
|---------|-------------|
| Vibe Brief Input | Text prompt + reference image upload |
| Auto Shot Planner | AI decomposes brief → creative brief → narrative arc → scene breakdown → shot list |
| Project Bible | Stores style, subjects, continuity notes, world rules, camera language |
| Multi-Provider Generation | 4–8 shots per project, 2 providers in architecture (Runway, Veo) |
| Generation State Machine | Draft → Planned → Queued → Submitted → Processing → Completed / Failed / Canceled / Expired |
| Timeline Assembly Shell | Basic timeline with clip ordering, duration display |
| Shot Operations | Regenerate, extend, swap, trim, reorder |
| Export Rough Cut | Stitch timeline clips to downloadable video |
| BYOK Key Management | Encrypted provider API key storage, per-provider config |
| Provider Abstraction | Adapter pattern supporting Runway, Veo, Luma (Luma as third) |

### Surfaces

| # | Surface | Route |
|---|---------|-------|
| 1 | Landing Page | `/` |
| 2 | Dashboard | `/dashboard` |
| 3 | Create Project | `/projects/new` |
| 4 | Project Workspace | `/projects/[id]` |
| 5 | Assets | `/assets` |
| 6 | Timeline Editor | `/timeline/[id]` |
| 7 | Generations | `/generations` |
| 8 | API Keys / Integrations | `/settings/keys` |
| 9 | Settings | `/settings` |

### Architecture

- Supabase Postgres with RLS
- Supabase Auth (email + OAuth)
- Supabase Storage for assets
- Async job processing via Trigger.dev / Inngest
- Provider abstraction layer with typed adapters
- Versioned edits on all entities
- Structured Shot Specs (not just raw prompts)
- Timeline Patch model (trim, replace, extend, reorder, regenerate, restyle, upscale)

---

## Out of Scope (V1)

| Feature | Reason |
|---------|--------|
| Native mobile app | Web-first; mobile adds complexity with no clear V1 demand |
| Marketplace | No user base to monetize yet |
| Custom model training | Requires ML infra; use existing providers |
| Advanced collaboration | Real-time collab is a V2+ feature |
| Complex billing system | BYOK first; managed billing after product-market fit |
| More than 3 providers | Runway + Veo + Luma is sufficient for V1 architecture |
| Voice agent features | Audio is a separate domain; V1 is video-only |
| Audio / music generation | Out of scope; focus on visual timeline |
| Advanced color grading | Post-production; out of scope |
| Template marketplace | V2+ feature |

---

## V1 Constraints

1. **Max 8 shots per project** in V1 (soft limit, not hard-coded)
2. **2 active providers** (Runway, Veo) with Luma as third adapter
3. **No real-time collaboration** — single-user projects only
4. **No audio track** — video-only timeline
5. **Export = rough cut** — not final production output
6. **BYOK only** — no managed API billing
