export type ClientRuntime = 'web' | 'mobile-webview' | 'desktop-webview' | 'unknown';

type RuntimeBridge = {
  platform?: string;
  authRedirectBaseUrl?: string;
};

const MOBILE_UA_PATTERN = /Android|iPhone|iPad|iPod/i;
const DESKTOP_UA_PATTERN = /Macintosh|Windows NT|Linux x86_64/i;
const WEBVIEW_UA_PATTERN = /\bwv\b|WebView|(iPhone|iPad|iPod)(?!.*Safari)/i;

function readBridge(): RuntimeBridge | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const bridge = window.__VIDEOVIBER_RUNTIME__;
  return bridge && typeof bridge === 'object' ? bridge : null;
}

/**
 * Detects where the web app is currently running.
 *
 * This is intentionally coarse-grained and future-friendly.
 */
export function detectClientRuntime(userAgent?: string): ClientRuntime {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const bridge = readBridge();
  if (bridge?.platform === 'mobile-webview' || bridge?.platform === 'desktop-webview') {
    return bridge.platform;
  }

  const ua = userAgent ?? window.navigator.userAgent;
  const isMobile = MOBILE_UA_PATTERN.test(ua);
  const isDesktop = DESKTOP_UA_PATTERN.test(ua);
  const isWebView = WEBVIEW_UA_PATTERN.test(ua);

  if (isMobile && isWebView) {
    return 'mobile-webview';
  }

  if (isDesktop && isWebView) {
    return 'desktop-webview';
  }

  return 'web';
}

export function getRuntimeBridgeAuthBase(): string | null {
  const bridge = readBridge();
  const candidate = bridge?.authRedirectBaseUrl?.trim();
  return candidate ? candidate : null;
}
