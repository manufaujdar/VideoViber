export {};

declare global {
  interface Window {
    __VIDEOVIBER_RUNTIME__?: {
      platform?: 'mobile-webview' | 'desktop-webview';
      authRedirectBaseUrl?: string;
    };
  }
}
