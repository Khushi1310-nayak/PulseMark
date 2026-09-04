'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Database,
  Radio,
  MonitorSmartphone,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  ArrowDown,
  Info,
} from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  role: string;
  badge: string;
  icon: React.ElementType;
  details: string;
  tech: string[];
  latency: string;
  resilience: string;
  moduleReference: string;
}

const STAGES: Stage[] = [
  {
    id: 'stage-feed',
    name: '1. Ingestion Feed',
    role: 'Real-Time NSE Ingestion & Fallbacks',
    badge: 'Tier 1 Ingest',
    icon: Globe,
    details:
      'Queries live exchange prices and day change percentages for NSE Indian equities via Yahoo Finance (with canonical .NS mappings). If exchange drops out, instantly degrades to Tier 2 cache.',
    tech: ['yahoo-finance2', 'Circuit Breaker', 'Canonical Ticker Map'],
    latency: '80–180ms',
    resilience: 'Automatic failover to Redis Stale Cache on timeout or rate limit.',
    moduleReference: 'NSE Ingestion Feed & Circuit Breaker',
  },
  {
    id: 'stage-cache',
    name: '2. In-Memory Cache',
    role: 'Sub-Millisecond Tick & State Buffer',
    badge: 'Tier 2 Buffer',
    icon: Database,
    details:
      'Caches the latest broadcast batch with a 60-second TTL in Redis / in-memory store. Serves stale-tagged ticks (isStale: true) when external exchange disconnects.',
    tech: ['ioredis', 'Zero-Config In-Memory Fallback', 'Session Snapshot Store'],
    latency: '< 1ms',
    resilience: 'Zero-config memory map fallback ensures immediate out-of-the-box boot on any machine.',
    moduleReference: 'In-Memory Sliding Window Buffer',
  },
  {
    id: 'stage-sse',
    name: '3. SSE Distributor',
    role: 'Low-Overhead Unidirectional Streaming',
    badge: 'Tier 3 Stream',
    icon: Radio,
    details:
      'Streams tick bursts, evaluated anomaly scores, and heartbeat signals over native Server-Sent Events with keep-alive pings every 15 seconds. Bypasses complex WebSocket handshakes.',
    tech: ['Fastify SSE', 'text/event-stream', '15s Keep-Alive Ping'],
    latency: '~ 12ms',
    resilience: 'Native browser EventSource auto-reconnects with exponential backoff on dropped connections.',
    moduleReference: 'Fastify SSE Broadcast Pipeline',
  },
  {
    id: 'stage-client',
    name: '4. Client Change Engine',
    role: 'Temporal Delta Diffing & UI Deck',
    badge: 'Tier 4 Client',
    icon: MonitorSmartphone,
    details:
      'Receives ticks, executes pure evaluator scoring in shared TypeScript layer, highlights price flashes (emerald/rose), and re-ranks anomalous assets into the Attention Desk.',
    tech: ['Next.js 14', 'Framer Motion layoutId', 'navigator.sendBeacon', 'Tabular Nums'],
    latency: '< 5ms',
    resilience: 'Preserves exact T0 snapshot upon tab blur/unload via navigator.sendBeacon.',
    moduleReference: 'Client Temporal Change Engine',
  },
];

export function ArchitectureCanvas() {
  const [selectedStage, setSelectedStage] = useState<Stage>(STAGES[0]);

  return (
    <div className="rounded-xl border border-border bg-[#0B0E14] overflow-hidden my-6 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-border bg-slate-900/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Interactive Architecture & Data Flow Canvas
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Click any pipeline stage below to inspect</span>
      </div>

      {/* Pipeline Stages (Horizontal on desktop) */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = selectedStage.id === stage.id;

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage)}
                className={`relative text-left p-4 rounded-lg border transition-all flex flex-col justify-between h-full min-h-[145px] ${
                  isSelected
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'bg-surface hover:bg-slate-800/40 border-border hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-md ${
                        isSelected ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                      {stage.badge}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-100">{stage.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">{stage.role}</div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Latency: {stage.latency}</span>
                  <span className={isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {isSelected ? 'Active ●' : 'Inspect →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Drawer / Card */}
        <AnimatePresence mode="wait">
          {selectedStage && (
            <motion.div
              key={selectedStage.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-6 p-5 rounded-lg border border-border bg-slate-900/60 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <selectedStage.icon className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="font-mono font-bold text-sm text-slate-100">{selectedStage.name}: {selectedStage.role}</h4>
                    <span className="text-xs text-slate-400 font-mono">Architecture Module: <code className="text-emerald-300">{selectedStage.moduleReference}</code></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Budget:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-xs font-bold text-slate-200">
                    {selectedStage.latency}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{selectedStage.details}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
                <div className="p-3 rounded bg-slate-950/70 border border-border">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
                    Core Technologies & Patterns
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStage.tech.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-950/70 border border-border">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
                    Resilience & Fallback Mechanism
                  </span>
                  <div className="text-[11px] text-emerald-300 flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{selectedStage.resilience}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
