# Development and workspace ownership

The [documentation map](DOCUMENTATION_INDEX.md) links product requirements,
architecture and existing runtime gaps. Architecture diagrams describe the
intended system; the dated [readiness audit](architecture/production-readiness-audit.md)
records which persistence, authentication and provider paths remain incomplete.

## Run from the workspace root

Use Node.js 20.x and the exact pnpm version declared by the root
[package.json](../package.json) `packageManager` field, currently `pnpm@10.30.3`.
The lockfile belongs to the whole workspace.

```sh
pnpm --version
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Keep credentials in local environment files. A configured provider key does not
prove quota, model access or a successful generation. Do not run provider calls
as a documentation check.

## Choose the owning directory

| Change | Location |
| --- | --- |
| Web routes, workspace and server endpoints | [apps/web/](../apps/web/) |
| Future wrapper scaffolds | [mobile guide](../apps/mobile/README.md), [desktop guide](../apps/desktop/README.md) |
| Entity schemas and shared contracts | [packages/types/](../packages/types/) |
| Provider boundaries | [packages/sdk/](../packages/sdk/) |
| Agent interfaces and prompt templates | [packages/agents/](../packages/agents/), [packages/prompts/](../packages/prompts/) |
| Database and media boundaries | [packages/db/](../packages/db/), [packages/media/](../packages/media/) |
| Shared UI and configuration | [packages/ui/](../packages/ui/), [packages/config/](../packages/config/) |
| Database changes and callbacks | [supabase/](../supabase/), [function guide](../supabase/functions/README.md) |
| Product intent and workflow | [docs/prd/](prd/) |
| Architecture and interaction design | [docs/architecture/](architecture/), [docs/ux/](ux/) |

Keep shared contracts in their existing package instead of copying them into
an app. Update the relevant document alongside a boundary change; preserve the
original dates on historical audits.

## Quality commands

The root scripts define the supported checks:

```sh
pnpm security:scan-secrets
pnpm typecheck
pnpm lint
pnpm test
pnpm build:all
```

`pnpm build` builds only the web target; `pnpm build:all` delegates across the
workspace. Inspect the command's actual output before describing coverage.
Formatting can be checked with `pnpm format:check`; avoid a whole-repository
format rewrite for a small change.

CI uses `pnpm/action-setup` to read the same `packageManager` pin. Do not also
set a differing action `version`: that stops setup before any application check
runs. After a workflow repair, a fresh run must reach installation and the
remaining checks before claiming the baseline passes.
