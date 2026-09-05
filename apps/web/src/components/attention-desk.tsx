'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MeaningfulChange } from '@pulsemark/shared';
import { formatINR, formatPercent } from '../lib/utils';
import { Sparkline } from './sparkline';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Sparkles,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface AttentionDeskProps {
  anomalies: MeaningfulChange[];
  benchmarkLabel?: string;
  onOpenEvaluator: () => void;
}

export function AttentionDesk({ anomalies, benchmarkLabel, onOpenEvaluator }: AttentionDeskProps) {
  const [showAll, setShowAll] = useState(false);

  // Empty state: Calm, spacious, high-end mission control status
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="mb-8 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md p-8 text-center relative overflow-hidden shadow-lg">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-inner shadow-emerald-950">
          <Zap className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold font-mono text-slate-100">Market Operating Under Normal Parameters</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
          No statistical anomalies or threshold breaches detected since your session snapshot ({benchmarkLabel || 'T₀'}).
          All equities are currently trading within standard volatility boundaries.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenEvaluator}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Simulator to Inject Baseline Shocks →</span>
          </button>
        </div>
      </div>
    );
  }

  // Sort anomalies by anomalyScore descending so most urgent cards come first
  const sortedAnomalies = [...anomalies].sort((a, b) => b.anomalyScore - a.anomalyScore);
  const displayedAnomalies = showAll ? sortedAnomalies : sortedAnomalies.slice(0, 3);

  return (
    <div className="mb-8">
      {/* Executive Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm shadow-amber-950/40">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                Attention Desk
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold">
                Priority Signals
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                {anomalies.length} Signals
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Significant session deviations detected since <span className="text-sky-300 font-mono">{benchmarkLabel || 'T₀'}</span>
            </p>
          </div>
        </div>

        {/* Right Header Actions: Filter View & Simulator Launch */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {anomalies.length > 3 && (
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  !showAll
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Top 3 Priority
              </button>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  showAll
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                View All ({anomalies.length})
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenEvaluator}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 text-xs font-mono font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Shocks</span>
          </button>
        </div>
      </div>

      {/* Spacious 3-Column Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {displayedAnomalies.map((item) => {
            const isPositive = item.priceDelta >= 0;
            const isCritical = item.anomalyScore >= 75;
            const isHigh = item.anomalyScore >= 50 && item.anomalyScore < 75;
            const tags = getFormattedReasons(item);

            return (
              <motion.div
                key={item.symbol}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group relative rounded-2xl border bg-slate-900/80 backdrop-blur-xl p-5 transition-all duration-300 shadow-xl flex flex-col justify-between overflow-hidden ${
                  isCritical
                    ? 'border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/20'
                    : isHigh
                    ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20'
                    : 'border-slate-800/80 hover:border-slate-700 shadow-slate-950/30'
                }`}
              >
                {/* Decorative Top Gradient Stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] ${
                    isPositive
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent'
                      : 'bg-gradient-to-r from-rose-500 via-amber-400 to-transparent'
                  }`}
                />

                {/* Subtle Ambient Radial Glow */}
                {isCritical && (
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                )}
                {isHigh && (
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div>
                  {/* Card Header: Symbol, Name, Anomaly Score Pill */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <Link
                        href={`/stock/${item.symbol}`}
                        className="font-mono font-bold text-lg text-slate-100 group-hover:text-emerald-400 transition-colors tracking-wide flex items-center gap-1.5"
                      >
                        <span>{item.symbol}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                      </Link>
                      <p className="text-xs text-slate-400 font-sans truncate max-w-[200px] mt-0.5">
                        {item.name}
                      </p>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm shrink-0 ${
                        isCritical
                          ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                          : isHigh
                          ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                          : 'bg-slate-800/90 border border-slate-700 text-slate-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Score {item.anomalyScore}</span>
                    </div>
                  </div>

                  {/* Valuation & Percentage Delta Row */}
                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Live Price
                      </span>
                      <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                        {formatINR(item.currentPrice)}
                      </span>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 tabular-nums shadow-sm ${
                        isPositive
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>{formatPercent(item.priceDeltaPercent)}</span>
                    </div>
                  </div>

                  {/* Recessed Mini Telemetry Panel & Sparkline */}
                  <div className="my-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 shadow-inner">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <span className="text-slate-500">T₀ Delta:</span>
                        <strong className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatINR(item.priceDelta, { showSign: true })}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <span className="text-slate-500">Volume:</span>
                        <span
                          className={`font-semibold ${
                            item.volumeRatio >= 2.0 ? 'text-amber-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {item.volumeRatio.toFixed(1)}x normal
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <Sparkline
                        data={item.sparkline}
                        width={84}
                        height={24}
                        isPositive={isPositive}
                        strokeWidth={1.75}
                      />
                      <span className="text-[9px] font-mono text-slate-500 mt-0.5">Intraday 30M</span>
                    </div>
                  </div>

                  {/* Clean Rationale Tag Pills (No text truncation!) */}
                  <div className="space-y-1.5 min-h-[56px]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                      Trigger Rationale
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border ${tag.className}`}
                        >
                          {tag.icon}
                          <span>{tag.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tactile, Beautiful Card CTA Button */}
                <Link
                  href={`/stock/${item.symbol}`}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-400 text-xs font-mono font-bold flex items-center justify-between group/btn transition-all duration-200 shadow-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:text-slate-950 transition-colors" />
                    <span>Analyze Trajectory</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover/btn:text-slate-950 group-hover/btn:translate-x-1.5 transition-all" />
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Clean helper: parses reasons into concise, un-truncated tag chips
function getFormattedReasons(item: MeaningfulChange): { label: string; icon: React.ReactNode; className: string }[] {
  const tags: { label: string; icon: React.ReactNode; className: string }[] = [];

  for (const reason of item.reasons) {
    const lower = reason.label.toLowerCase();
    if (lower.includes('support')) {
      tags.push({
        label: "Day's Support Pierced",
        icon: <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />,
        className: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
      });
    } else if (lower.includes('resistance')) {
      tags.push({
        label: "Day's Resistance Pierced",
        icon: <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />,
        className: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
      });
    } else if (lower.includes('volume')) {
      tags.push({
        label: `${item.volumeRatio.toFixed(1)}x Volume Surge`,
        icon: <Zap className="w-3 h-3 text-amber-400 shrink-0" />,
        className: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
      });
    } else if (lower.includes('spread')) {
      tags.push({
        label: reason.label,
        icon: <Activity className="w-3 h-3 text-cyan-400 shrink-0" />,
        className: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
      });
    } else if (lower.includes('vwap')) {
      tags.push({
        label: 'VWAP Divergence',
        icon: <Zap className="w-3 h-3 text-purple-400 shrink-0" />,
        className: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
      });
    } else if (!lower.includes('delta')) {
      tags.push({
        label: reason.label,
        icon: <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />,
        className: 'bg-slate-800/80 border-slate-700 text-slate-300',
      });
    }
    if (tags.length >= 2) break;
  }

  if (tags.length === 0) {
    tags.push({
      label: `${item.priceDeltaPercent >= 0 ? '+' : ''}${item.priceDeltaPercent.toFixed(1)}% Session Drift`,
      icon: <Activity className="w-3 h-3 text-amber-400 shrink-0" />,
      className: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
    });
  }

  return tags;
}
