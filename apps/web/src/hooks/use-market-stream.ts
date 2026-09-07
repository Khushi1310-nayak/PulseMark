'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { StockTick, MeaningfulChange, SessionSnapshot } from '@pulsemark/shared';
import { getCleanApiBase } from '../lib/api';

export type ConnectionState = 'LIVE' | 'STALE' | 'RECONNECTING' | 'OFFLINE';

export interface MarketStreamData {
  ticks: Record<string, StockTick>;
  attentionDesk: MeaningfulChange[];
  allEvaluations: MeaningfulChange[];
  snapshot: SessionSnapshot | null;
  connectionState: ConnectionState;
  lastUpdated: string;
  flashStates: Record<string, 'up' | 'down' | null>;
  feedHealth: {
    source: string;
    isCircuitBreakerTripped: boolean;
    errorCount: number;
    latencyMs: number;
  };
}

export function useMarketStream() {
  const [data, setData] = useState<MarketStreamData>({
    ticks: {},
    attentionDesk: [],
    allEvaluations: [],
    snapshot: null,
    connectionState: 'RECONNECTING',
    lastUpdated: new Date().toISOString(),
    flashStates: {},
    feedHealth: {
      source: 'LIVE_FEED',
      isCircuitBreakerTripped: false,
      errorCount: 0,
      latencyMs: 12,
    },
  });

  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, any>>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<any>(null);

  const triggerPriceFlash = useCallback((symbol: string, direction: 'up' | 'down') => {
    setData((prev) => ({
      ...prev,
      flashStates: {
        ...prev.flashStates,
        [symbol]: direction,
      },
    }));

    if (flashTimersRef.current[symbol]) {
      clearTimeout(flashTimersRef.current[symbol]);
    }

    flashTimersRef.current[symbol] = setTimeout(() => {
      setData((prev) => ({
        ...prev,
        flashStates: {
          ...prev.flashStates,
          [symbol]: null,
        },
      }));
    }, 500);
  }, []);

  const handleIncomingPayload = useCallback(
    (payload: any) => {
      const { ticks, tick, attentionDesk, allEvaluations, snapshot, feedHealth } = payload;
      const ticksMap: Record<string, StockTick> = {};
      const newFlashStates: Record<string, 'up' | 'down' | null> = {};

      const tickList = Array.isArray(ticks) ? ticks : tick ? [tick] : [];

      if (tickList.length > 0) {
        for (const t of tickList) {
          ticksMap[t.symbol] = t;
          const prevPrice = prevPricesRef.current[t.symbol];
          if (prevPrice !== undefined && prevPrice !== t.price) {
            const dir = t.price > prevPrice ? 'up' : 'down';
            newFlashStates[t.symbol] = dir;
            triggerPriceFlash(t.symbol, dir);
          } else if (prevPrice === undefined) {
            // Initial price seed
          }
          prevPricesRef.current[t.symbol] = t.price;
        }
      }

      const connectionState: ConnectionState = feedHealth?.isCircuitBreakerTripped
        ? 'STALE'
        : 'LIVE';

      setData((prev) => ({
        ticks: { ...prev.ticks, ...ticksMap },
        attentionDesk: attentionDesk ?? prev.attentionDesk,
        allEvaluations: allEvaluations ?? prev.allEvaluations,
        snapshot: snapshot ?? prev.snapshot,
        connectionState,
        lastUpdated: new Date().toISOString(),
        flashStates: { ...prev.flashStates, ...newFlashStates },
        feedHealth: feedHealth ?? prev.feedHealth,
      }));
    },
    [triggerPriceFlash]
  );

  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const cleanApiBase = getCleanApiBase();
    const sseUrl = cleanApiBase ? `${cleanApiBase}/api/stream/ticks` : '/api/stream/ticks';
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setData((prev) => ({ ...prev, connectionState: 'LIVE' }));
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        handleIncomingPayload(parsed);
      } catch (err) {
        // Heartbeat or parse skip
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setData((prev) => ({ ...prev, connectionState: 'RECONNECTING' }));

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
      reconnectAttemptsRef.current += 1;

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, delay);
    };
  }, [handleIncomingPayload]);

  useEffect(() => {
    connectSSE();
    const flashTimers = flashTimersRef.current;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      Object.values(flashTimers).forEach((t) => {
        if (t) clearTimeout(t as any);
      });
    };
  }, [connectSSE]);

  const refreshSession = useCallback(async () => {
    try {
      const cleanApiBase = getCleanApiBase();
      const url = cleanApiBase ? `${cleanApiBase}/api/session/snapshot` : '/api/session/snapshot';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          handleIncomingPayload(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  }, [handleIncomingPayload]);

  const applyImmediateState = useCallback(
    (payload: any) => {
      if (!payload) return;
      handleIncomingPayload(payload);
    },
    [handleIncomingPayload]
  );

  return {
    ...data,
    refreshSession,
    applyImmediateState,
  };
}
