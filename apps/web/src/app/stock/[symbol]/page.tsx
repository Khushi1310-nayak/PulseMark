'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StockDeepDiveResponse, StockHistoricalCandle } from '@pulsemark/shared';
import { api } from '../../../lib/api';
import { formatINR, formatPercent, formatVolume, formatTime, formatBenchmarkTimeLabel } from '../../../lib/utils';
import { StockChart } from '../../../components/stock-chart';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  AlertCircle,
  BarChart3,
  Layers,
  History,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function StockDeepDivePage() {
  const params = useParams();
  const symbol = (params?.symbol as string)?.toUpperCase() || '';

  const [data, setData] = useState<StockDeepDiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandle, setSelectedCandle] = useState<StockHistoricalCandle | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    api.getStockDeepDive(symbol)
      .then((res) => {
        setData(res);
        if (res.history && res.history.length > 0) {
          setSelectedCandle(res.history[res.history.length - 1]);
        }
      })
      .catch((err) => {
        console.error('Failed to load stock deep dive:', err);
        setError(`Unable to load data for ${symbol}`);
      })
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="font-mono text-sm text-slate-300">Evaluating temporal state for {symbol}...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="p-6 max-w-md w-full rounded-xl bg-surface border border-border text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-100 font-mono">Stock Evaluation Unavailable</h2>
          <p className="text-xs text-slate-400">{error || 'Asset not found in market registry.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal</span>
          </Link>
        </div>
      </div>
    );
  }

  const { current, benchmark, delta, anomaly, history, auditLogs } = data;
  const isPositiveDelta = delta.priceDelta >= 0;
  const isPositiveDay = current.change24hPercent >= 0;

  // Filter out any stale/corrupt legacy triggers referencing pre-demerger 985 prices or -53% crashes
  const cleanAuditLogs = (auditLogs || []).filter(
    (log) =>
      !log.details?.includes('985') &&
      !log.title?.includes('53.') &&
      !log.details?.includes('53.') &&
      !log.details?.includes('54.')
  );

  // Safe chart metrics (guard against empty candle history)
  const safeHistory: StockHistoricalCandle[] = history && history.length > 0 ? history : [
    {
      timestamp: new Date().toISOString(),
      open: current.price,
      high: current.price,
      low: current.price,
      close: current.price,
      volume: current.volume,
      vwap: current.vwap,
      isAnomalyPoint: false,
    }
  ];
  const minPrice = Math.min(...safeHistory.map((c) => c.low));
  const maxPrice = Math.max(...safeHistory.map((c) => c.high));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col terminal-grid pb-12">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-border text-slate-300 hover:text-white hover:border-slate-700 transition-colors text-xs font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Watchlist Terminal</span>
              </Link>

              <div className="h-4 w-px bg-slate-800" />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-mono font-bold text-lg text-slate-100">{current.symbol}</h1>
                  <span className="text-xs text-slate-400 font-normal">{current.name}</span>
                  {anomaly.requiresAttention && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 border border-amber-500/40 text-amber-300 font-semibold">
                      ATTENTION REQUIRED (Score {anomaly.anomalyScore})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Current Price & Day Metric */}
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
                  {formatINR(current.price)}
                </div>
                <div
                  className={`text-xs font-mono font-semibold tabular-nums flex items-center justify-end gap-1 ${
                    isPositiveDay ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositiveDay ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{formatPercent(current.change24hPercent)} (24h)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Deep-Dive Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Session Benchmark Alert Banner */}
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-200">
                  TEMPORAL DELTA ANALYSIS (vs Session Baseline)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                  {formatBenchmarkTimeLabel({
                    benchmarkTime: data.benchmarkTime,
                    benchmarkLabel: data.benchmarkLabel,
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Net displacement since your last visit:{' '}
                <strong className={isPositiveDelta ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatINR(delta.priceDelta, { showSign: true })} ({formatPercent(delta.priceDeltaPercent)})
                </strong>
                {' '}• Volume running at <strong className="text-amber-400">{delta.volumeRatio.toFixed(1)}x</strong> normal rate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Composite Anomaly Index:</span>
            <span className="px-3 py-1 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm">
              {anomaly.anomalyScore} / 100
            </span>
          </div>
        </div>

        {/* Temporal Delta Breakdown Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Price Comparison */}
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">1. Price Baseline Diff</span>
            <div className="my-3">
              <div className="text-lg font-mono font-bold text-slate-100 tabular-nums">
                {formatINR(current.price)}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Session T₀: {formatINR(benchmark?.price || current.openPrice)}
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded w-fit ${
                isPositiveDelta
                  ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/80 border border-rose-500/30 text-rose-400'
              }`}
            >
              {isPositiveDelta ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{formatINR(delta.priceDelta, { showSign: true })} ({formatPercent(delta.priceDeltaPercent)})</span>
            </div>
          </div>

          {/* 2. Volume Expansion */}
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">2. Volume Surge Ratio</span>
            <div className="my-3">
              <div className="text-lg font-mono font-bold text-slate-100 tabular-nums">
                {delta.volumeRatio.toFixed(1)}x <span className="text-xs text-slate-400 font-normal">of 30d Avg</span>
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Current Vol: {formatVolume(current.volume)}
              </div>
            </div>
            <span
              className={`text-xs font-mono px-2 py-1 rounded w-fit ${
                delta.volumeRatio >= 2.0
                  ? 'bg-amber-950/80 border border-amber-500/30 text-amber-300 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              {delta.volumeRatio >= 2.0 ? '⚡ Unusual Volume Surge' : 'Normal Volume Flow'}
            </span>
          </div>

          {/* 3. VWAP Divergence */}
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">3. Intraday VWAP</span>
            <div className="my-3">
              <div className="text-lg font-mono font-bold text-slate-100 tabular-nums">
                {formatINR(current.vwap)}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Diff: {formatINR(current.price - current.vwap, { showSign: true })}
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded w-fit bg-slate-900 border border-slate-800 text-slate-300">
              {current.price >= current.vwap ? 'Trading Above VWAP' : 'Trading Below VWAP'}
            </span>
          </div>

          {/* 4. Day Range Extremes */}
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">4. Day's Range</span>
            <div className="my-3">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Low: ₹{current.dayLow.toFixed(1)}</span>
                <span>High: ₹{current.dayHigh.toFixed(1)}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500"
                  style={{
                    left: `${Math.max(0, Math.min(100, ((current.price - current.dayLow) / (current.dayHigh - current.dayLow || 1)) * 100))}%`,
                    width: '6px',
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded w-fit bg-slate-900 border border-slate-800 text-slate-300">
              52W Peak: ₹{current.week52High.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Interactive Real Financial Intraday Chart Component */}
        <StockChart
          symbol={symbol}
          history={safeHistory}
          benchmark={benchmark}
          currentPrice={current.price}
          benchmarkLabel={formatBenchmarkTimeLabel({
            benchmarkTime: data.benchmarkTime,
            benchmarkLabel: data.benchmarkLabel,
          })}
          onSelectCandle={(candle) => setSelectedCandle(candle)}
          selectedCandle={selectedCandle}
        />

        {/* Threshold Audit Log */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wide">
              Threshold Audit Log (Trigger History)
            </h3>
          </div>

          <div className="divide-y divide-border/60">
            {cleanAuditLogs.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-mono">
                No active threshold breaches logged for {symbol}. All telemetry nominal.
              </div>
            ) : (
              cleanAuditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-amber-950/70 border border-amber-500/30 text-amber-400 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200 text-xs">{log.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {log.triggerType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-slate-200">
                      {formatINR(log.priceAtTrigger)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
