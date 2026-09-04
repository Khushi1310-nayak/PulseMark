'use client';

import { useEffect, useRef } from 'react';
import { api, getCleanApiBase } from '../lib/api';

export function useSessionTracker() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Session Liveness: Periodic 30-second heartbeat to keep session active
    const heartbeatInterval = setInterval(() => {
      api.sendHeartbeat().catch(() => {
        // Silent failure on transient network glitch; will retry next interval
      });
    }, 30000);

    // Initial ping on component mount
    api.sendHeartbeat().catch(() => {});

    // 2. Lifecycle Decision: navigator.sendBeacon for Reliable Session Snapshotting (T0)
    // When a user closes the tab, navigates away, or hides the browser window, standard fetch/XHR
    // calls are often cancelled mid-flight. navigator.sendBeacon guarantees asynchronous transmission
    // in the browser networking thread even after page destruction, reliably committing the exit snapshot.
    const handleUnloadOrHide = () => {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const cleanApiBase = getCleanApiBase();
        const url = cleanApiBase ? `${cleanApiBase}/api/session/snapshot` : '/api/session/snapshot';
        const payload = JSON.stringify({ timestamp: new Date().toISOString() });
        navigator.sendBeacon(url, payload);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleUnloadOrHide();
      }
    };

    window.addEventListener('beforeunload', handleUnloadOrHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleUnloadOrHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
