# Desktop Wrapper Foundation

This directory is reserved for future desktop wrappers (macOS/Windows/Linux).

Current status: foundation only (no desktop shell generated yet).

## Recommended path

- Wrapper runtime: Tauri (preferred) or Electron
- Web app source: `apps/web`
- Hosted deployment target: Vercel URL (preferred for SSR)

## Why this exists now

- Creates a dedicated surface for desktop packaging work.
- Avoids mixing desktop runtime concerns into web-only modules.
- Allows gradual adoption of native desktop capabilities.

## Next implementation phase

1. Initialize desktop shell project (`src-tauri` or Electron app shell).
2. Point shell webview to deployed web URL.
3. Inject runtime bridge for callback handling and desktop-only capabilities.
4. Add secure IPC bridges for filesystem/export workflows.

See `tauri.conf.json.example` for baseline settings.
