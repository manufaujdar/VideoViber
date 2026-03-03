# Mobile Wrapper Foundation

This directory is reserved for future Android and iOS wrappers.

Current status: foundation only (no native project generated yet).

## Recommended path

- Wrapper runtime: Capacitor
- Web app source: `apps/web`
- Hosted deployment target: Vercel URL (preferred for SSR)

## Why this exists now

- Keeps mobile-specific files isolated from web app code.
- Enables incremental migration without refactoring core product flows.
- Aligns with shared runtime bridge and auth callback abstractions in `apps/web/src/lib`.

## Next implementation phase

1. Add `package.json` with Capacitor dependencies.
2. Generate native projects (`android/`, `ios/`).
3. Configure deep-link callbacks to set `window.__VIDEOVIBER_RUNTIME__`.
4. Add native plugin adapters (camera/files/share/haptics) behind a web-safe bridge.

See `capacitor.config.ts.example` for baseline config.
