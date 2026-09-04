'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  Code2,
  ChevronDown,
  Terminal,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { ArchitectureCanvas } from './components/architecture-canvas';
import { FormulaPlayground } from './components/formula-playground';
import { CodeSnippet } from './components/code-snippet';

const DOC_SECTIONS = [
  { id: 'pitch', label: '100-Word Pitch', icon: Sparkles },
  { id: 'architecture', label: 'Architecture & Pipeline', icon: Layers },
  { id: 'formulas', label: 'Quantitative Heuristics', icon: Activity },
  { id: 'resilience', label: 'Resilience Playbook', icon: ShieldCheck },
  { id: 'adrs', label: 'Architectural Decisions (ADRs)', icon: Cpu },
  { id: 'contracts', label: 'Data Contracts & API', icon: Code2 },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>('pitch');
  const [openAdr, setOpenAdr] = useState<string | null>('adr-sse');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (const section of DOC_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleAdr = (id: string) => {
    setOpenAdr(openAdr === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-300">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-slate-800/80 bg-[#090D15]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs font-mono">
            <Link href="/" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span>PulseMark Terminal</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Engineering & Architecture Docs
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-medium border border-emerald-500/30 transition-all"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sticky Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-6">
              <div className="p-4 rounded-xl bg-[#0c1018] border border-slate-800">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-3">
                  Table of Contents
                </div>
                <nav className="space-y-1">
                  {DOC_SECTIONS.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.id;
                    return (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        onClick={() => setActiveSection(sec.id)}
                        className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeDocIndicator"
                            className="absolute left-0 w-1 h-5 bg-emerald-400 rounded-r"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{sec.label}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Right Main Column */}
          <main className="lg:col-span-9 space-y-16">

            {/* SECTION 1: Product Overview */}
            <section id="pitch" className="space-y-4 scroll-mt-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Product Overview & Architecture</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
                PulseMark: The Event-Driven Temporal Change Engine
              </h1>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#0c1018] to-[#121824] border border-slate-700/60 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold">100-WORD PRODUCT PITCH</span>
                  <span>Core Value Proposition</span>
                </div>
                <blockquote className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal italic border-l-2 border-emerald-500 pl-4 py-1">
                  &ldquo;PulseMark transforms standard, passive stock watchlists into an event-driven change engine for active market participants. Rather than flooding investors with noisy, unranked daily percentage changes, PulseMark automatically snapshots your portfolio state upon exit ($T_0$) and computes multi-factor temporal deltas upon return ($T_1$). Through price displacement, volume surges, and structural range breaches, our anomaly evaluator separates noise from conviction. High-urgency developments are promoted directly to the Attention Desk with human-readable rationale chips, while stable assets remain quiet in the Watchlist Matrix. Powered by live NSE market feeds, resilient circuit breakers, and sub-50ms delta scoring.&rdquo;
                </blockquote>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
                  <span>Executive Summary • 99 Words</span>
                  <span className="text-emerald-400 font-medium">Production Architecture</span>
                </div>
              </div>
            </section>

            {/* SECTION 2: Architecture & Data Flow */}
            <section id="architecture" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                <Layers className="w-4 h-4" />
                <span>Architecture Blueprint</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                Real-Time End-to-End Ingestion Pipeline
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                PulseMark utilizes a high-throughput, low-latency temporal architecture. Rather than polling heavy database clusters on every tick, all market ticks flow through an in-memory sliding window, stream via Server-Sent Events, and are diffed against the user&apos;s $T_0$ snapshot in O(1) time.
              </p>

              {/* Interactive Architecture Canvas */}
              <ArchitectureCanvas />
            </section>

            {/* SECTION 3: Quantitative Heuristics & Formula Playground */}
            <section id="formulas" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                <Activity className="w-4 h-4" />
                <span>Quantitative Evaluator</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                The &quot;Meaningful Change&quot; Anomaly Formula
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Passive watchlists order tickers alphabetically or by daily percent change (P_t &minus; P_open). This hides intraday reversals, post-logout drops, and unusual volume expansions. PulseMark evaluates a multi-factor composite anomaly score (Score &isin; [0, 100]):
              </p>

              {/* Mathematical Formulation Card */}
              <div className="p-5 rounded-xl bg-[#0c1018] border border-slate-800 space-y-4 font-mono text-xs">
                <div className="text-slate-300 font-bold text-sm">Mathematical Formulation:</div>
                <div className="p-3.5 rounded bg-slate-900 border border-slate-800/80 text-emerald-400 text-xs overflow-x-auto">
                  Score = min(100, W_price · φ_price(ΔP) + W_vol · φ_vol(V/V_30d) + W_range · φ_range(H_0, L_0) + W_vwap · φ_vwap)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[11px] text-slate-400">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200">1. Temporal Price Delta (φ_price):</span>
                    <p>Detects displacement since user&apos;s personal logout ($T_0$). |ΔP| ≥ 1.5% (+30 pts); |ΔP| ≥ 3.0% (+45 pts, critical).</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200">2. Volume Surge Multiplier (φ_vol):</span>
                    <p>Compares tick volume rate against 30-day baseline. V_ratio ≥ 2.0x (+25 pts); V_ratio ≥ 3.0x (+35 pts, institutional spike).</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200">3. Range Breach (φ_range):</span>
                    <p>Price piercing above $T_0$ dayHigh (+25 pts) or crashing through $T_0$ dayLow (+30 pts, critical).</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200">4. VWAP Extension (φ_vwap):</span>
                    <p>Intraday deviation &gt; 1.5% from volume-weighted mean (+15 pts) flagging mean-reversion risk.</p>
                  </div>
                </div>
              </div>

              {/* Interactive Sandbox */}
              <FormulaPlayground />
            </section>

            {/* SECTION 4: Resilience Playbook */}
            <section id="resilience" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Fault Tolerance</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                Resilience Playbook & Edge Case Handlers
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Market conditions are volatile and external network feeds are prone to transient rate limits or disconnects. PulseMark is hardened with deterministic fallback paths across 5 critical edge cases:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resilience Item 1 */}
                <div className="p-5 rounded-xl bg-[#0c1018] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>3-Tier Circuit Breaker Ingestion</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Live Yahoo Finance NSE API calls execute with timeout guards. If the upstream provider rate-limits or times out (3 consecutive failures), the circuit trips to <strong>CACHED (Redis Fallback)</strong>, and finally to <strong>SYNTHETIC MOCK</strong> so the terminal never freezes.
                  </p>
                  <div className="font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                    <span>LIVE_FEED → STALE_CACHE → SYNTHETIC</span>
                    <span className="text-emerald-400">Zero downtime</span>
                  </div>
                </div>

                {/* Resilience Item 2 */}
                <div className="p-5 rounded-xl bg-[#0c1018] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>First-Time User (T₀ = null) Fallback</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When a user opens PulseMark for the first time, there is no prior session snapshot. Rather than throwing errors or rendering empty deltas, the engine automatically benchmarks against <strong>Day Market Open (09:15 AM IST)</strong> and renders an explicit informational badge.
                  </p>
                  <div className="font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                    <span>Default: Market Open (09:15 AM)</span>
                    <span className="text-blue-400">Clean Onboarding</span>
                  </div>
                </div>

                {/* Resilience Item 3 */}
                <div className="p-5 rounded-xl bg-[#0c1018] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span>Mid-Session Added Stocks</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    If an investor adds a new ticker mid-session, diffing it against a 4-hour-old session snapshot will trigger false anomaly alerts. PulseMark captures the exact <strong>Price at Time of Addition (T_add)</strong> as that stock&apos;s baseline for the rest of the active visit.
                  </p>
                  <div className="font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                    <span>Scoped to addition timestamp</span>
                    <span className="text-amber-400">No False Alerts</span>
                  </div>
                </div>

                {/* Resilience Item 4 */}
                <div className="p-5 rounded-xl bg-[#0c1018] border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                    <Zap className="w-4 h-4 text-rose-400" />
                    <span>SSE Auto-Reconnection & Heartbeats</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The Fastify SSE stream emits 30-second keep-alive heartbeats to prevent proxies from terminating idle connections. The client implements exponential backoff retry with automatic local buffer replay upon reconnect.
                  </p>
                  <div className="font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                    <span>Heartbeat: 30s • Max Backoff: 10s</span>
                    <span className="text-rose-400">Self-Healing</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: Architectural Decision Records (ADRs) */}
            <section id="adrs" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider font-semibold">
                <Cpu className="w-4 h-4" />
                <span>Trade-Off Analysis</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                Architectural Decision Records (ADRs)
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Key engineering and architectural trade-offs evaluated during system design to guarantee sub-50ms latency, high resilience, and seamless scalability:
              </p>

              <div className="space-y-3">
                {/* ADR 1 */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0c1018]">
                  <button
                    onClick={() => toggleAdr('adr-sse')}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ADR-001
                      </span>
                      <span className="font-semibold text-slate-200 text-sm">
                        Why Server-Sent Events (SSE) instead of Full-Duplex WebSockets?
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        openAdr === 'adr-sse' ? 'transform rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openAdr === 'adr-sse' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/80 space-y-2 leading-relaxed"
                      >
                        <p>
                          <strong>Context:</strong> Financial watchlists require continuous price updates from server to client. User actions (like adding a stock or changing sensitivity) are infrequent, discrete REST calls.
                        </p>
                        <p>
                          <strong>Decision:</strong> We chose HTTP/2 Server-Sent Events (SSE) over WebSockets. SSE runs over standard HTTP/2, multiplexing seamlessly across the same TCP connection without proxy interference or stateful WebSocket handshake overhead.
                        </p>
                        <p>
                          <strong>Benefits:</strong> Built-in native browser reconnection (`EventSource`), standard HTTP caching and TLS termination, lower memory consumption per client on Fastify, and frictionless traversal of institutional corporate firewalls.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ADR 2 */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0c1018]">
                  <button
                    onClick={() => toggleAdr('adr-store')}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        ADR-002
                      </span>
                      <span className="font-semibold text-slate-200 text-sm">
                        Why In-Memory Default with Layered Redis/Postgres Adapter?
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        openAdr === 'adr-store' ? 'transform rotate-180 text-blue-400' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openAdr === 'adr-store' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/80 space-y-2 leading-relaxed"
                      >
                        <p>
                          <strong>Context:</strong> In high-frequency market streaming, querying persistent relational storage (e.g., disk-bound PostgreSQL) on every inbound tick introduces unacceptable I/O latency bottlenecks and database connection pool contention.
                        </p>
                        <p>
                          <strong>Decision:</strong> Implemented a dual-layer Repository Pattern. At its core, an ultra-fast in-memory sliding-window buffer handles microsecond tick lookups and immediate session diffing. When horizontal scaling is required, a persistent Redis cluster (for hot state sharing) and PostgreSQL (for durable session snapshots and audit trails) layer on transparently via pluggable adapter interfaces without modifying business logic.
                        </p>
                        <p>
                          <strong>Benefits:</strong> Sub-millisecond read/write latency on active market ticks, resilient zero-dependency fallback if external persistence experiences network partitions, and linear horizontal scalability across cloud instances.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ADR 3 */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0c1018]">
                  <button
                    onClick={() => toggleAdr('adr-eval')}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        ADR-003
                      </span>
                      <span className="font-semibold text-slate-200 text-sm">
                        Why Multi-Factor Temporal Deltas vs Standard Daily % Change?
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        openAdr === 'adr-eval' ? 'transform rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openAdr === 'adr-eval' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/80 space-y-2 leading-relaxed"
                      >
                        <p>
                          <strong>Context:</strong> A stock may show &ldquo;+0.2% today&rdquo; on a standard watchlist. However, if that stock was up +3.8% when you checked at 11:00 AM and has since crashed -3.6% in the last 20 minutes, a standard daily delta renders you blind to the reversal.
                        </p>
                        <p>
                          <strong>Decision:</strong> PulseMark persists the exact price and volume coordinates at your prior exit ($T_0$) and compares current ticks ($T_1$) against your personal timeline.
                        </p>
                        <p>
                          <strong>Benefits:</strong> Eliminates cognitive overhead. Traders immediately spot what changed *since they were last here*, rather than re-reading the entire market from 09:15 AM.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            {/* SECTION 6: API Reference & Data Contracts */}
            <section id="contracts" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider font-semibold">
                <Code2 className="w-4 h-4" />
                <span>Type Definitions & Schemas</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                API Reference & Data Contracts
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                PulseMark shares strict, end-to-end TypeScript interfaces between the Fastify backend engine and the Next.js client. All payloads represent sanitized, public client-server data contracts with zero exposure of internal database credentials, server filesystem paths, or authentication secrets.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2 font-semibold">
                    1. StockTick Interface (Real-Time Ingestion Event)
                  </div>
                  <CodeSnippet
                    filename="Data Contract: StockTick"
                    code={`export interface StockTick {
  symbol: string;               // e.g. "TATAMOTORS.NS", "RELIANCE.NS"
  name: string;                 // e.g. "Tata Motors Limited"
  price: number;                // Current traded market price (₹)
  change24h: number;            // Daily nominal price change (₹)
  change24hPercent: number;     // Daily percentage change (%)
  volume: number;               // Cumulative volume traded
  avgVolume30d: number;         // Trailing 30-day baseline volume
  volumeRatio: number;          // volume / expected_hourly_baseline
  dayHigh: number;              // Current session high
  dayLow: number;               // Current session low
  week52High: number;           // 52-week trailing peak
  week52Low: number;            // 52-week trailing trough
  openPrice: number;            // Today's opening price (09:15 AM IST)
  prevClose: number;            // Yesterday's closing settlement
  vwap: number;                 // Volume Weighted Average Price
  bidPrice: number;             // Top-of-book best bid (₹)
  askPrice: number;             // Top-of-book best ask (₹)
  spread: number;               // Ask - Bid spread in ₹
  timestamp: string;            // ISO-8601 UTC timestamp
  sparkline: number[];          // Trailing historical intraday points
  isStale?: boolean;            // Circuit-breaker flag
}`}
                  />
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2 font-semibold">
                    2. MeaningfulChange Interface (Anomaly Evaluation Output)
                  </div>
                  <CodeSnippet
                    filename="Data Contract: MeaningfulChange"
                    code={`export interface MeaningfulChange {
  symbol: string;
  name: string;
  currentPrice: number;
  benchmarkPrice: number;       // Price at T0 logout
  priceDelta: number;           // currentPrice - benchmarkPrice
  priceDeltaPercent: number;    // % change since last session
  dayChangePercent: number;     // Daily % change from open
  volume: number;
  volumeRatio: number;
  vwap: number;
  dayHigh: number;
  dayLow: number;
  reasons: AnomalyReason[];     // Explanatory rationale chips
  anomalyScore: number;         // 0 to 100 composite ranking
  requiresAttention: boolean;   // True if Score >= 40 or Critical
  detectedAt: string;
  sparkline: number[];
  isStale?: boolean;
}`}
                  />
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2 font-semibold">
                    3. SessionSnapshot Interface (User T0 Temporal Anchor)
                  </div>
                  <CodeSnippet
                    filename="Data Contract: SessionSnapshot"
                    code={`export interface SessionSnapshot {
  userId: string;               // Anonymous client session token (e.g. 'guest-session')
  timestamp: string;            // Time of session commit/exit (T0)
  prices: Record<string, BenchmarkPricePoint>;
  isFirstSession?: boolean;     // Handles T0 = null edge case
}`}
                  />
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
