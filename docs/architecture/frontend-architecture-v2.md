# Frontend Architecture v2

## Goals

- Enforce feature boundaries instead of app-route coupling.
- Separate domain state, infrastructure, and UI rendering concerns.
- Improve sync correctness under concurrent user actions.

## Directory Strategy

```text
apps/web/src/
  app/                          # Route files only
  features/
    workspace/
      hooks/                    # Feature lifecycle hooks
      store/                    # State machine, selectors
      index.ts                  # Public feature API
    account/
      team/                     # Team membership/invite services
      billing/                  # Billing summary + portal services
  lib/                          # Shared low-level clients/helpers
  components/                   # Reusable view primitives
```

### Route Layer Rule

`app/**/page.tsx` files should orchestrate UI and call feature APIs only.
They should not embed backend access logic directly.

## Workspace Domain Design

### Public API

`features/workspace/index.ts` exports:

- `useAppStore` (state + commands)
- `workspaceSelectors` (stable read-model selectors)
- `useWorkspaceBootstrap` (feature lifecycle bootstrap)
- typed domain models (`Project`, `Shot`, `Asset`, `Generation`, `UserSettings`)

### State Management

- The workspace store hydrates from Supabase on boot.
- Mutations are optimistic in UI.
- Backend writes are serialized through a queue to preserve operation order and reduce race conditions.

### Sync Algorithm

1. Apply UI update immediately.
2. Enqueue backend mutation in FIFO queue.
3. On success: clear sync error state.
4. On failure: keep optimistic state visible but surface sync failure for retry flow.

This avoids out-of-order writes (for example rename + archive + restore) under rapid clicking.

### Refresh Policy

`useWorkspaceBootstrap` initializes the store once and refreshes on tab focus when data is stale.
This keeps multi-tab behavior closer to backend truth while controlling network noise.

## Account Domains

- `features/account/team` centralizes collaborator CRUD logic against `workspace_collaborators`.
- `features/account/billing` centralizes usage/billing aggregation and billing portal bootstrap.
- Settings pages consume these feature APIs instead of embedding table access logic in routes.

## Migration Policy

- Database migrations must mirror UI state requirements (status fields, metadata, settings).
- New UI controls are considered incomplete until their storage columns and RLS policies exist.

## Coding Standards

- Keep page files focused on composition and events.
- Keep backend shape mapping in store/infrastructure layer.
- Prefer selectors over ad-hoc filtering logic in many pages.
- Avoid local-only fallbacks for production user flows.
