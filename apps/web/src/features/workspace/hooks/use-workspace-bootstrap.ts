'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/workspace-store';

const REFRESH_STALE_MS = 90_000;

export function useWorkspaceBootstrap() {
  const initialized = useAppStore((state) => state.initialized);
  const initializing = useAppStore((state) => state.initializing);
  const backendReady = useAppStore((state) => state.backendReady);
  const initializeWorkspace = useAppStore((state) => state.initializeWorkspace);
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);
  const lastBackgroundRefreshAtRef = useRef<number>(0);

  useEffect(() => {
    void initializeWorkspace();
  }, [initializeWorkspace]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      if (!initialized || initializing || !backendReady) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastBackgroundRefreshAtRef.current;
      if (elapsed < REFRESH_STALE_MS) {
        return;
      }

      lastBackgroundRefreshAtRef.current = now;
      void refreshWorkspace();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [initialized, initializing, backendReady, refreshWorkspace]);
}
