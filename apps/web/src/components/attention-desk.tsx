'use client';

import React from 'react';
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
} from 'lucide-react';

interface AttentionDeskProps {
  anomalies: MeaningfulChange[];
  benchmarkLabel?: string;
  onOpenEvaluator: () => void;
}

export function AttentionDesk({ anomalies, benchmarkLabel, onOpenEvaluator }: AttentionDeskProps) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-border bg-surface/50 p-6 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mb-3">
          <Zap className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Market Operating Under Normal Parameters</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          No statistical anomalies or threshold breaches detected since your last session snapshot ({benchmarkLabel || '09:15 AM'}).
        </p>
        <button
          onClick={onOpenEvaluator}
          className="mt-3 inline-flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 underline underline-offset-4"
        >
          <span>Use Evaluator to inject simulated shocks →</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-400">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            ATTENTION DESK <span className="text-slate-400 font-normal">({benchmarkLabel ? `What changed since ${benchmarkLabel}` : 'Session Anomalies'})</span>
          </h2>
          <span className="ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 font-semibold">
            {anomalies.length} Required Attention
          </span>
        </div>

        <button
          onClick={onOpenEvaluator}
          className="text-xs font-mono text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <span>Simulate Ticks</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        <AnimatePresence mode="popLayout">
          {anomalies.map((item) => {
            const isPositive = item.priceDelta >= 0;
            return (
              <motion.div
                key={item.symbol}
                layoutId={`attention-${item.symbol}`}
                initial={{ scale: 0.94, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="group relative rounded-lg border border-border hover:border-slate-700 bg-surface hover:bg-surface-subtle p-4 transition-all shadow-md hover:shadow-lg flex flex-col justify-between"
              >
                {/* Card Top: Symbol, Anomaly Score, Price */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/stock/${item.symbol}`}
                          className="font-mono font-bold text-base text-slate-100 group-hover:text-emerald-400 transition-colors"
                        >
                          {item.symbol}
                        </Link>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-medium">
                          Score {item.anomalyScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{item.name}</p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-slate-100 tabular-nums">
                        {formatINR(item.currentPrice)}
                      </div>
                      <div
                        className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold tabular-nums ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{formatPercent(item.priceDeltaPercent)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Sparkline Preview */}
                  <div className="my-2.5 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-mono">Intraday Delta:</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINR(item.priceDelta, { showSign: true })}
                      </span>
                      <Sparkline data={item.sparkline} width={64} height={20} isPositive={isPositive} strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Rationale Chips */}
                  <div className="space-y-1.5 mt-2.5">
                    {item.reasons.slice(0, 3).map((reason, idx) => {
                      const isCritical = reason.severity === 'critical';
                      const isHigh = reason.severity === 'high';

                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono ${
                            isCritical
                              ? 'bg-rose-950/50 border border-rose-500/30 text-rose-300'
                              : isHigh
                              ? 'bg-amber-950/50 border border-amber-500/30 text-amber-300'
                              : 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                          }`}
                        >
                          {isCritical ? (
                            <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <span className="font-semibold truncate">{reason.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer: Deep dive link */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">Vol: {item.volumeRatio.toFixed(1)}x normal</span>
                  <Link
                    href={`/stock/${item.symbol}`}
                    className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
