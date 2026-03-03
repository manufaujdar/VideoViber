# Cross-Platform Foundation

Last updated: March 3, 2026

## Goal

Create a lightweight base so VideoViber can move to Android, iOS, and desktop wrappers later without a full refactor.

## Foundation Added

1. Runtime abstraction in web app
- File: `apps/web/src/lib/runtime.ts`
- Detects coarse runtime (`web`, `mobile-webview`, `desktop-webview`).
- Accepts runtime bridge hints from wrappers via `window.__VIDEOVIBER_RUNTIME__`.

2. Auth callback abstraction
- File: `apps/web/src/lib/auth-redirect.ts`
- Centralizes redirect URL creation.
- Supports future wrapper overrides through:
  - Runtime bridge (`window.__VIDEOVIBER_RUNTIME__.authRedirectBaseUrl`)
  - `NEXT_PUBLIC_MOBILE_AUTH_REDIRECT_BASE_URL`
  - `NEXT_PUBLIC_DESKTOP_AUTH_REDIRECT_BASE_URL`
  - `NEXT_PUBLIC_AUTH_REDIRECT_BASE_URL`

3. PWA shell baseline
- Files: `apps/web/public/manifest.webmanifest`, `apps/web/public/icons/*`
- Metadata hook in `apps/web/src/app/layout.tsx`.
- Enables installable baseline and improves compatibility with app-shell workflows.

4. Wrapper scaffolding directories
- `apps/mobile/` with `capacitor.config.ts.example`
- `apps/desktop/` with `tauri.conf.json.example`

## Wrapper Runtime Bridge Contract

Wrappers should inject this object before auth flows that require callback URLs:

```ts
window.__VIDEOVIBER_RUNTIME__ = {
  platform: 'mobile-webview', // or 'desktop-webview'
  authRedirectBaseUrl: 'videoviber://auth'
};
```

This lets existing auth pages keep working while wrappers control callback targets.

## What Is Intentionally Not Included Yet

- Native project generation (`android/`, `ios/`, `src-tauri/`)
- Platform plugin integrations (camera, share, filesystem, haptics)
- Offline sync and local database layer
- Desktop IPC and export acceleration

## Next Phase Checklist

1. Add Capacitor project and validate OAuth deep links end-to-end.
2. Add Tauri/Electron shell and secure desktop bridge.
3. Introduce a shared platform capability API (web-safe fallbacks + native implementations).
4. Add mobile and desktop CI lanes for smoke tests and signed build pipelines.
