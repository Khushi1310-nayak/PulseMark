'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StockHistoricalCandle, BenchmarkPricePoint } from '@pulsemark/shared';
import { formatINR, formatPercent, formatVolume, formatTime } from '../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  LineChart as LineChartIcon,
  CandlestickChart as CandlestickIcon,
  Zap,
  Info,
  Clock,
  Crosshair,
} from 'lucide-react';

interface StockChartProps {
  symbol: string;
  history: StockHistoricalCandle[];
  benchmark?: BenchmarkPricePoint | null;
  currentPrice: number;
  benchmarkLabel?: string;
  onSelectCandle?: (candle: StockHistoricalCandle) => void;
  selectedCandle?: StockHistoricalCandle | null;
}

export function StockChart({
  symbol,
  history,
  benchmark,
  currentPrice,
  benchmarkLabel,
  onSelectCandle,
  selectedCandle,
}: StockChartProps) {
  const [chartMode, setChartMode] = useState<'line' | 'candles'>('line');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const safeHistory = useMemo(() => {
    if (history && history.length > 0) return history;
    return [
      {
        timestamp: new Date().toISOString(),
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: 1000,
        vwap: currentPrice,
        isAnomalyPoint: false,
      },
    ];
  }, [history, currentPrice]);

  // Compute price bounds
  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    const lows = safeHistory.map((c) => c.low);
    const highs = safeHistory.map((c) => c.high);
    const vols = safeHistory.map((c) => c.volume);

    if (benchmark?.price) {
      lows.push(benchmark.price);
      highs.push(benchmark.price);
    }

    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.08 || min * 0.02 || 1;
    const paddedMin = Math.max(0, min - padding);
    const paddedMax = max + padding;

    return {
      minPrice: paddedMin,
      maxPrice: paddedMax,
      priceRange: paddedMax - paddedMin || 1,
      maxVolume: Math.max(...vols, 1),
    };
  }, [safeHistory, benchmark]);

  const benchmarkPrice = benchmark?.price;
  const isOverallPositive = safeHistory.length > 1
    ? safeHistory[safeHistory.length - 1].close >= safeHistory[0].open
    : true;
  const strokeColor = isOverallPositive ? '#10B981' : '#F43F5E';

  // Chart Layout constants
  const chartHeight = 280;
  const priceAreaHeight = 210;
  const volumeAreaHeight = 60;
  const yAxisWidth = 72;

  // Y-Axis Price Ticks (5 real coordinate price levels)
  const priceTicks = useMemo(() => {
    const ticks: number[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      ticks.push(maxPrice - (i / steps) * priceRange);
    }
    return ticks;
  }, [minPrice, maxPrice, priceRange]);

  // X-Axis Time Ticks (Sampled from history)
  const timeTicks = useMemo(() => {
    if (safeHistory.length <= 1) return [];
    const count = Math.min(5, safeHistory.length);
    const step = Math.floor((safeHistory.length - 1) / (count - 1 || 1));
    const sampled: { index: number; time: string }[] = [];

    for (let i = 0; i < safeHistory.length; i += step) {
      const candle = safeHistory[i];
      if (candle) {
        try {
          const d = new Date(candle.timestamp);
          const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          sampled.push({ index: i, time });
        } catch {
          // fallback
        }
      }
      if (sampled.length >= count) break;
    }
    return sampled;
  }, [safeHistory]);

  // Active hover target
  const activeCandle = hoveredIndex !== null
    ? safeHistory[hoveredIndex]
    : selectedCandle || safeHistory[safeHistory.length - 1];

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || safeHistory.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const availableWidth = rect.width - yAxisWidth;
    const ratio = Math.max(0, Math.min(1, clientX / availableWidth));
    const index = Math.round(ratio * (safeHistory.length - 1));

    setHoveredIndex(index);
    setMousePos({ x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setMousePos(null);
  };

  // Generate SVG Points for Line & Area
  const { linePath, areaPath } = useMemo(() => {
    const points = safeHistory.map((c, i) => {
      const xPct = (i / (safeHistory.length - 1 || 1)) * 100;
      const yPct = ((maxPrice - c.close) / priceRange) * 100;
      return { x: xPct, y: yPct };
    });

    const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const areaString = `${pathString} L 100,100 L 0,100 Z`;

    return { linePath: pathString, areaPath: areaString };
  }, [safeHistory, maxPrice, priceRange]);

  // Benchmark Y Coordinate in percentage
  const benchmarkYPercent = benchmarkPrice !== undefined
    ? ((maxPrice - benchmarkPrice) / priceRange) * 100
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4 shadow-xl">
      {/* Chart Top Header & Coordinate Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <LineChartIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wide">
                Intraday Price Trajectory & Coordinate Canvas
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                5-Min Cadence
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive X (Timeline) & Y (Valuation) coordinate plane mapped against $T_0$ session baseline.
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Line vs Candlestick */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-border">
            <button
              onClick={() => setChartMode('line')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                chartMode === 'line'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              onClick={() => setChartMode('candles')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                chartMode === 'candles'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CandlestickIcon className="w-3.5 h-3.5" />
              <span>Candles</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Cursor / Node Coordinate Readout */}
      {activeCandle && (
        <div className="px-3.5 py-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(activeCandle.timestamp)}</span>
            </span>
            <span className="text-slate-200">
              Price: <strong className="text-emerald-400 font-bold">₹{activeCandle.close.toFixed(2)}</strong>
            </span>
            {benchmarkPrice && (
              <span className="text-slate-400">
                vs T₀ ({benchmarkLabel || 'Baseline'}):{' '}
                <span className={activeCandle.close >= benchmarkPrice ? 'text-emerald-400' : 'text-rose-400'}>
                  {activeCandle.close >= benchmarkPrice ? '+' : ''}
                  ₹{(activeCandle.close - benchmarkPrice).toFixed(2)} (
                  {(((activeCandle.close - benchmarkPrice) / benchmarkPrice) * 100).toFixed(2)}%)
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>O: <span className="text-slate-200">{activeCandle.open.toFixed(2)}</span></span>
            <span>H: <span className="text-slate-200">{activeCandle.high.toFixed(2)}</span></span>
            <span>L: <span className="text-slate-200">{activeCandle.low.toFixed(2)}</span></span>
            <span>Vol: <span className="text-slate-200">{formatVolume(activeCandle.volume)}</span></span>
            {activeCandle.isAnomalyPoint && (
              <span className="px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[10px] font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 text-rose-400" />
                <span>{activeCandle.anomalyReason || 'Anomaly Alert'}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Coordinate Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="h-80 w-full bg-slate-950/95 rounded-xl border border-slate-800/90 relative overflow-hidden flex cursor-crosshair select-none"
      >
        {/* SVG Drawing Layer (Available width excludes Y-axis) */}
        <div className="flex-1 h-full relative" style={{ marginRight: `${yAxisWidth}px` }}>
          {/* Price Plot Area (Top 75%) */}
          <div className="w-full relative" style={{ height: `${priceAreaHeight}px` }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={`chart-grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
                  <stop offset="60%" stopColor={strokeColor} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Horizontal Price Grid Lines */}
              {[0, 25, 50, 75, 100].map((pct, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={pct}
                  x2="100"
                  y2={pct}
                  stroke="rgba(51, 65, 85, 0.35)"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Session Baseline (T0) Horizontal Reference Guideline */}
              {benchmarkYPercent !== null && benchmarkYPercent >= 0 && benchmarkYPercent <= 100 && (
                <g>
                  <line
                    x1="0"
                    y1={benchmarkYPercent}
                    x2="100"
                    y2={benchmarkYPercent}
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}

              {/* Line Mode: Area Gradient Fill */}
              {chartMode === 'line' && (
                <path d={areaPath} fill={`url(#chart-grad-${symbol})`} />
              )}

              {/* Line Mode: Primary SVG Spline */}
              {chartMode === 'line' && (
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  d={linePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Candlestick Mode: Real Japanese Candles with Wicks */}
              {chartMode === 'candles' &&
                safeHistory.map((c, idx) => {
                  const xPct = (idx / (safeHistory.length - 1 || 1)) * 100;
                  const candleWidth = Math.max(0.6, 65 / safeHistory.length);
                  const highY = ((maxPrice - c.high) / priceRange) * 100;
                  const lowY = ((maxPrice - c.low) / priceRange) * 100;
                  const openY = ((maxPrice - c.open) / priceRange) * 100;
                  const closeY = ((maxPrice - c.close) / priceRange) * 100;
                  const isBullish = c.close >= c.open;
                  const candleColor = isBullish ? '#10B981' : '#F43F5E';
                  const bodyTop = Math.min(openY, closeY);
                  const bodyHeight = Math.max(0.8, Math.abs(closeY - openY));

                  return (
                    <g key={idx} className="cursor-pointer" onClick={() => onSelectCandle?.(c)}>
                      {/* Upper & Lower Wick */}
                      <line
                        x1={xPct}
                        y1={highY}
                        x2={xPct}
                        y2={lowY}
                        stroke={candleColor}
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                      {/* Candle Body */}
                      <rect
                        x={xPct - candleWidth / 2}
                        y={bodyTop}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={candleColor}
                        stroke={candleColor}
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}

              {/* Data Node Markers (Dots & Anomaly Flares) */}
              {safeHistory.map((c, idx) => {
                const xPct = (idx / (safeHistory.length - 1 || 1)) * 100;
                const yPct = ((maxPrice - c.close) / priceRange) * 100;
                const isHovered = hoveredIndex === idx;
                const isSelected = selectedCandle?.timestamp === c.timestamp;

                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onClick={() => onSelectCandle?.(c)}
                  >
                    {/* Anomaly Ping Halo */}
                    {c.isAnomalyPoint && (
                      <circle
                        cx={xPct}
                        cy={yPct}
                        r="6"
                        fill="rgba(244, 63, 94, 0.4)"
                        stroke="#F43F5E"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        className="animate-ping"
                      />
                    )}

                    {/* Point Circle */}
                    <circle
                      cx={xPct}
                      cy={yPct}
                      r={c.isAnomalyPoint ? '4' : isHovered || isSelected ? '4.5' : '2'}
                      fill={c.isAnomalyPoint ? '#F43F5E' : isHovered || isSelected ? '#FFFFFF' : strokeColor}
                      stroke={isHovered || isSelected ? strokeColor : '#070A0F'}
                      strokeWidth={isHovered || isSelected ? '2' : '1'}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Volume Histogram Panel (Bottom 20%) */}
          <div
            className="w-full absolute bottom-7 left-0 right-0 border-t border-slate-800/60 pt-1"
            style={{ height: `${volumeAreaHeight}px` }}
          >
            <div className="absolute top-1 left-2 text-[9px] font-mono text-slate-500 uppercase">
              Volume Distribution
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {safeHistory.map((c, idx) => {
                const xPct = (idx / (safeHistory.length - 1 || 1)) * 100;
                const barWidth = Math.max(0.6, 60 / safeHistory.length);
                const heightPct = (c.volume / maxVolume) * 85;
                const yPct = 100 - heightPct;
                const isBullish = c.close >= c.open;
                const isHovered = hoveredIndex === idx;

                return (
                  <rect
                    key={idx}
                    x={xPct - barWidth / 2}
                    y={yPct}
                    width={barWidth}
                    height={heightPct}
                    fill={
                      isHovered
                        ? '#38BDF8'
                        : isBullish
                        ? 'rgba(16, 185, 129, 0.45)'
                        : 'rgba(244, 63, 94, 0.45)'
                    }
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          </div>

          {/* X-Axis Timeline Coordinates (Bottom Axis) */}
          <div className="absolute bottom-0 left-0 right-0 h-7 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-2">
            {timeTicks.map((tick, i) => (
              <span key={i} className="text-[10px] font-mono text-slate-400">
                {tick.time}
              </span>
            ))}
          </div>

          {/* Crosshair Cursor Indicator Lines */}
          {mousePos && hoveredIndex !== null && (
            <>
              {/* Vertical Crosshair Line */}
              <div
                className="absolute top-0 bottom-7 border-l border-dashed border-cyan-400/70 pointer-events-none"
                style={{
                  left: `${(hoveredIndex / (safeHistory.length - 1 || 1)) * 100}%`,
                }}
              />
              {/* Horizontal Crosshair Line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-cyan-400/70 pointer-events-none"
                style={{ top: `${Math.max(0, Math.min(priceAreaHeight, mousePos.y))}px` }}
              />
            </>
          )}
        </div>

        {/* Real Y-Axis (Price Coordinates Column on the Right) */}
        <div
          className="absolute top-0 right-0 bottom-7 border-l border-slate-800 bg-slate-900/90 flex flex-col justify-between py-2 px-2 select-none"
          style={{ width: `${yAxisWidth}px` }}
        >
          {priceTicks.map((price, idx) => (
            <div key={idx} className="text-[10px] font-mono text-slate-400 text-right">
              ₹{price.toFixed(1)}
            </div>
          ))}

          {/* Active Baseline (T0) Pill on Y-Axis */}
          {benchmarkPrice && benchmarkYPercent !== null && (
            <div
              className="absolute right-1 transform -translate-y-1/2 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/50 text-[9px] font-mono text-sky-300 font-bold shadow pointer-events-none"
              style={{ top: `${(benchmarkYPercent / 100) * priceAreaHeight}px` }}
            >
              T₀ ₹{benchmarkPrice.toFixed(0)}
            </div>
          )}

          {/* Current Live Price Pill on Y-Axis */}
          <div
            className={`absolute right-1 bottom-3 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow pointer-events-none ${
              isOverallPositive
                ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300'
                : 'bg-rose-950 border border-rose-500/60 text-rose-300'
            }`}
          >
            ₹{currentPrice.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Hover cursor across the coordinate canvas to track real X/Y coordinates in real-time.</span>
        <span className="text-sky-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>Dashed cyan line marks session reference baseline ($T_0$)</span>
        </span>
      </div>
    </div>
  );
}
