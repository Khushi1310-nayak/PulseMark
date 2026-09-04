'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Terminal, Cpu, BookOpen } from 'lucide-react';

interface FooterProps {
  feedSource?: string;
  lastPingMs?: number;
}

export function Footer({ feedSource = 'LIVE_FEED', lastPingMs = 24 }: FooterProps) {
  const [liveLatency, setLiveLatency] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Measure actual round-trip network latency to API
  useEffect(() => {
    let isMounted = true;

    const measurePing = async () => {
      try {
        const start = performance.now();
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const cleanApiBase = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
        const healthUrl = cleanApiBase ? `${cleanApiBase}/api/health` : '/api/health';
        const res = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
        if (res.ok && isMounted) {
          const elapsed = Math.round(performance.now() - start);
          setLiveLatency(elapsed);
          setIsConnected(true);
        } else if (isMounted) {
          setIsConnected(false);
        }
      } catch {
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayedLatency = liveLatency !== null ? liveLatency : lastPingMs;
  const getSourceBadge = () => {
    switch (feedSource) {
      case 'LIVE_FEED':
        return <span className="text-emerald-400 font-mono">● LIVE (NSE / Yahoo)</span>;
      case 'STALE_REDIS_CACHE':
      case 'STALE_CACHE':
        return <span className="text-amber-400 font-mono">▲ CACHED (Redis Fallback)</span>;
      case 'SYNTHETIC_MOCK_FEED':
      case 'SYNTHETIC_MOCK':
        return <span className="text-cyan-400 font-mono">■ SIMULATED</span>;
      default:
        return <span className="text-emerald-400 font-mono">● LIVE (NSE / Yahoo)</span>;
    }
  };

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#070A0F] text-slate-400 text-xs py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2 text-slate-100 font-bold text-sm tracking-wide">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-sans font-bold text-slate-100">
                Pulse<span className="text-emerald-400">Mark</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs pr-6">
              Event-driven temporal change engine and real-time market surveillance platform. Tracking multi-dimensional price and volume deltas across your trading sessions.
            </p>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Platform
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/" className="hover:text-slate-200 transition-colors">
                  Main Dashboard
                </Link>
              </li>
              <li>
                <a href="/#attention-desk" className="hover:text-slate-200 transition-colors">
                  Attention Desk
                </a>
              </li>
              <li>
                <a href="/#watchlist" className="hover:text-slate-200 transition-colors">
                  Watchlist Matrix
                </a>
              </li>
              <li>
                <Link
                  href="/?demo=evaluator"
                  className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  <Terminal className="w-3 h-3" /> Market Simulator
                </Link>
              </li>
            </ul>
          </div>

          {/* Equities */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Markets
            </h4>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li>
                <Link href="/stock/TATAMOTORS" className="hover:text-emerald-400 transition-colors">
                  TATAMOTORS.NS
                </Link>
              </li>
              <li>
                <Link href="/stock/INFY" className="hover:text-emerald-400 transition-colors">
                  INFY.NS
                </Link>
              </li>
              <li>
                <Link href="/stock/RELIANCE" className="hover:text-emerald-400 transition-colors">
                  RELIANCE.NS
                </Link>
              </li>
              <li>
                <Link href="/stock/TCS" className="hover:text-emerald-400 transition-colors">
                  TCS.NS
                </Link>
              </li>
              <li>
                <Link href="/stock/HDFCBANK" className="hover:text-emerald-400 transition-colors">
                  HDFCBANK.NS
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Documentation
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/docs" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-slate-300">
                  <BookOpen className="w-3 h-3 text-emerald-400" />
                  <span>Architecture & Pipeline</span>
                </Link>
              </li>
              <li>
                <Link href="/docs#formulas" className="hover:text-slate-200 transition-colors">
                  Anomaly Heuristics
                </Link>
              </li>
              <li>
                <Link href="/docs#resilience" className="hover:text-slate-200 transition-colors">
                  Resilience Playbook
                </Link>
              </li>
              <li>
                <Link href="/docs#contracts" className="hover:text-slate-200 transition-colors">
                  API Reference
                </Link>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Activity className="w-3 h-3 text-slate-500" />
                  <span>Feed:</span> {getSourceBadge()}
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 PulseMark. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 font-mono">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3 h-3 text-slate-400" />
              <span>Latency:</span>
              {isConnected && displayedLatency !== null ? (
                <span className="text-emerald-400 font-bold tabular-nums">{displayedLatency}ms</span>
              ) : (
                <span className="text-rose-400 font-bold">Offline</span>
              )}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>SSE Heartbeat: 30s</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
