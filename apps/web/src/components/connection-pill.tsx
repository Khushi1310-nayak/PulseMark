'use client';

import React from 'react';
import { ConnectionState } from '../hooks/use-market-stream';
import { Radio, AlertTriangle, RefreshCw, Database, Activity } from 'lucide-react';

interface ConnectionPillProps {
  state: ConnectionState;
  source?: string;
  isCircuitBreakerTripped?: boolean;
}

export function ConnectionPill({ state, source, isCircuitBreakerTripped }: ConnectionPillProps) {
  if (state === 'LIVE' && !isCircuitBreakerTripped && source !== 'SYNTHETIC_MOCK_FEED') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono transition-all"
        title="Connected to Live NSE Market Feed (Yahoo Finance)"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span className="font-semibold tracking-wide">Live Feed</span>
      </div>
    );
  }

  if (source === 'STALE_REDIS_CACHE' || (isCircuitBreakerTripped && source !== 'SYNTHETIC_MOCK_FEED')) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono transition-all"
        title="Circuit Breaker Active: Serving cached prices"
      >
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        <span className="font-semibold">Cached</span>
      </div>
    );
  }

  if (source === 'SYNTHETIC_MOCK_FEED') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono transition-all"
        title="Simulation Mode Active"
      >
        <Database className="w-3 h-3 text-cyan-400" />
        <span className="font-semibold">Simulated</span>
      </div>
    );
  }

  if (state === 'RECONNECTING') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-mono transition-all"
        title="Reconnecting to feed stream..."
      >
        <RefreshCw className="w-3 h-3 animate-spin text-rose-400" />
        <span className="font-semibold">Reconnecting</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] font-mono">
      <Activity className="w-3 h-3" />
      <span>Offline</span>
    </div>
  );
}
