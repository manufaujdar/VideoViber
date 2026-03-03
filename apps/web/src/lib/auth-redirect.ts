import { detectClientRuntime, getRuntimeBridgeAuthBase } from '@/lib/runtime';

const fallbackOrigin = 'http://localhost:3000';

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizePath(pathname: string) {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function joinBaseAndPath(baseUrl: string, pathname: string) {
  return `${normalizeBaseUrl(baseUrl)}${normalizePath(pathname)}`;
}

/**
 * Returns an auth callback URL that can be overridden by native wrappers.
 *
 * Priority:
 * 1) Runtime bridge value (window.__VIDEOVIBER_RUNTIME__.authRedirectBaseUrl)
 * 2) Wrapper-specific env overrides
 * 3) Generic auth base env override
 * 4) Current web origin / NEXT_PUBLIC_APP_URL
 */
export function buildAuthRedirectUrl(pathname: string) {
  const runtimeBridgeBase = getRuntimeBridgeAuthBase();
  if (runtimeBridgeBase) {
    return joinBaseAndPath(runtimeBridgeBase, pathname);
  }

  const runtime = detectClientRuntime();
  if (runtime === 'mobile-webview' && process.env.NEXT_PUBLIC_MOBILE_AUTH_REDIRECT_BASE_URL) {
    return joinBaseAndPath(process.env.NEXT_PUBLIC_MOBILE_AUTH_REDIRECT_BASE_URL, pathname);
  }

  if (runtime === 'desktop-webview' && process.env.NEXT_PUBLIC_DESKTOP_AUTH_REDIRECT_BASE_URL) {
    return joinBaseAndPath(process.env.NEXT_PUBLIC_DESKTOP_AUTH_REDIRECT_BASE_URL, pathname);
  }

  if (process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE_URL) {
    return joinBaseAndPath(process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE_URL, pathname);
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return joinBaseAndPath(window.location.origin, pathname);
  }

  return joinBaseAndPath(process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin, pathname);
}
