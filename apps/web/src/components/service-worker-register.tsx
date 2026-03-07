'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        void navigator.serviceWorker.register('/sw.js').catch(() => {
          // ignore registration failures in production and development
        });
      });
    }
  }, []);

  return null;
}
