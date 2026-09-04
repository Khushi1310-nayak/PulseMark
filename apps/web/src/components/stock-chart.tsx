'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StockHistoricalCandle, BenchmarkPricePoint } from '@pulsemark/shared';
import { formatINR, formatPercent, formatVolume, formatTime } from '../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const safeHistory = useMemo(() => {
    if (history && history.length > 0) return history;
    return [
      {
        timestamp: new Date().toISOString(),
        open: currentPrice,
        high: currentPrice * 1.002,
        low: currentPrice * 0.998,
        close: currentPrice,
        volume: 1000,
        vwap: currentPrice,
        isAnomalyPoint: false,
      },
    ];
  }, [history, currentPrice]);

  // Scaled strictly to intraday price action (Google Finance / TradingView style)
  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    const lows = safeHistory.map((c) => c.low);
    const highs = safeHistory.map((c) => c.high);
    const vols = safeHistory.map((c) => c.volume);

    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const spread = max - min || min * 0.01 || 1;
    // 12% vertical breathing room so the line never hits top or bottom edges
    const padding = spread * 0.12;
    const paddedMin = Math.max(0, min - padding);
    const paddedMax = max + padding;

    return {
      minPrice: paddedMin,
      maxPrice: paddedMax,
      priceRange: paddedMax - paddedMin || 1,
      maxVolume: Math.max(...vols, 1),
    };
  }, [safeHistory]);

  const benchmarkPrice = benchmark?.price;
  const isOverallPositive = safeHistory.length > 1
    ? safeHistory[safeHistory.length - 1].close >= safeHistory[0].open
    : true;
  const strokeColor = isOverallPositive ? '#10B981' : '#F43F5E';

  // Chart layout dimensions
  const yAxisWidth = 75;
  const bottomTimelineHeight = 28;
  const volumeBarMaxHeightPct = 18; // bottom 18% reserved for volume histogram

  // Y-Axis Price Ticks (5 real coordinate levels)
  const priceTicks = useMemo(() => {
    const ticks: number[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      ticks.push(maxPrice - (i / steps) * priceRange);
    }
    return ticks;
  }, [minPrice, maxPrice, priceRange]);

  // X-Axis Timeline Ticks
  const timeTicks = useMemo(() => {
    if (safeHistory.length <= 1) return [];
    const count = Math.min(6, safeHistory.length);
    const step = Math.max(1, Math.floor((safeHistory.length - 1) / (count - 1)));
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

  // Active hover candle or selected / latest candle
  const activeCandle = hoveredIndex !== null
    ? safeHistory[hoveredIndex]
    : selectedCandle || safeHistory[safeHistory.length - 1];

  // Mouse move handler for interactive scrubbing crosshairs
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || safeHistory.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const availableWidth = rect.width - yAxisWidth;
    if (clientX < 0 || clientX > availableWidth) return;

    const ratio = Math.max(0, Math.min(1, clientX / availableWidth));
    const index = Math.round(ratio * (safeHistory.length - 1));

    setHoveredIndex(index);
    setMousePos({ x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setMousePos(null);
  };

// Smooth Catmull-Rom to Cubic Bézier Spline for professional financial charts (TradingView / Apple Stocks)
function buildSmoothSpline(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)},${pts[1].y.toFixed(2)}`;
  }

  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

  // Generate SVG Path & Area Coordinates (pure line chart with glowing gradient fill)
  const { linePath, areaPath, points } = useMemo(() => {
    const pts = safeHistory.map((c, i) => {
      const xPct = (i / (safeHistory.length - 1 || 1)) * 100;
      const yPct = ((maxPrice - c.close) / priceRange) * 100;
      return { x: xPct, y: yPct, close: c.close, candle: c };
    });

    const pathD = buildSmoothSpline(pts);
    const lastX = pts[pts.length - 1]?.x ?? 100;
    const firstX = pts[0]?.x ?? 0;
    const areaD = `${pathD} L ${lastX.toFixed(2)},100 L ${firstX.toFixed(2)},100 Z`;

    return { linePath: pathD, areaPath: areaD, points: pts };
  }, [safeHistory, maxPrice, priceRange]);

  // Active hover coordinate
  const activeHoverPoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  // Benchmark line: only draw guideline if within visible intraday range
  const isBenchmarkInView = benchmarkPrice !== undefined && benchmarkPrice >= minPrice && benchmarkPrice <= maxPrice;
  const benchmarkYPercent = isBenchmarkInView && benchmarkPrice !== undefined
    ? ((maxPrice - benchmarkPrice) / priceRange) * 100
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4 shadow-xl">
      {/* Chart Top Header & Coordinate Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wide">
              Intraday Price Trajectory & Coordinate Canvas
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              Live Line Stream
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Continuous intraday financial trajectory with real X (Timeline) & Y (Valuation) coordinate axes.
          </p>
        </div>

        {/* Baseline Reference Tag in Header */}
        {benchmarkPrice && (
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 self-start md:self-center">
            <span className="text-slate-400">Baseline (T₀: {benchmarkLabel || 'Session'}):</span>
            <span className="text-sky-300 font-bold">₹{benchmarkPrice.toFixed(2)}</span>
            <span
              className={`text-[11px] font-semibold ${
                currentPrice >= benchmarkPrice ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ({currentPrice >= benchmarkPrice ? '+' : ''}
              {(((currentPrice - benchmarkPrice) / benchmarkPrice) * 100).toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* Active Cursor / Node Coordinate Readout */}
      {activeCandle && (
        <div className="px-4 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(activeCandle.timestamp)}</span>
            </span>
            <span className="text-slate-100">
              Price:{' '}
              <strong className={`text-sm font-bold ${isOverallPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{activeCandle.close.toFixed(2)}
              </strong>
            </span>
            {benchmarkPrice && (
              <span className="text-slate-400 hidden sm:inline">
                vs T₀:{' '}
                <span className={activeCandle.close >= benchmarkPrice ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {activeCandle.close >= benchmarkPrice ? '+' : ''}
                  ₹{(activeCandle.close - benchmarkPrice).toFixed(2)} (
                  {(((activeCandle.close - benchmarkPrice) / benchmarkPrice) * 100).toFixed(2)}%)
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Vol: <strong className="text-slate-200">{formatVolume(activeCandle.volume)}</strong></span>
            <span>VWAP: <strong className="text-slate-200">₹{activeCandle.vwap?.toFixed(2) || activeCandle.close.toFixed(2)}</strong></span>
            {activeCandle.isAnomalyPoint && (
              <span className="px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
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
        {/* SVG Drawing Layer (Width excludes Y-axis) */}
        <div className="flex-1 h-full relative" style={{ marginRight: `${yAxisWidth}px` }}>
          {/* Main Price Line Area (Top section above timeline) */}
          <div className="w-full absolute inset-0 bottom-7">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={`line-fill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.22} />
                  <stop offset="65%" stopColor={strokeColor} stopOpacity={0.04} />
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
                  stroke="rgba(51, 65, 85, 0.28)"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* T0 Baseline Reference Guideline (if within intraday view) */}
              {benchmarkYPercent !== null && (
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
              )}

              {/* Volume Histogram (Subtle bars at bottom 18%) */}
              {safeHistory.map((c, idx) => {
                const xPct = (idx / (safeHistory.length - 1 || 1)) * 100;
                const barWidth = Math.max(0.8, 65 / safeHistory.length);
                const heightPct = (c.volume / maxVolume) * volumeBarMaxHeightPct;
                const yPct = 100 - heightPct;
                const isBullish = c.close >= c.open;

                return (
                  <rect
                    key={idx}
                    x={xPct - barWidth / 2}
                    y={yPct}
                    width={barWidth}
                    height={heightPct}
                    fill={isBullish ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {/* Area Gradient Fill */}
              <path d={areaPath} fill={`url(#line-fill-${symbol})`} />

              {/* Clean Financial Stroke Path */}
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                d={linePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Live Price Pulsing Dot (HTML overlay at latest point to maintain perfect circle geometry) */}
            {points.length > 0 && (
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: `${points[points.length - 1].x}%`,
                  top: `${points[points.length - 1].y}%`,
                }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: strokeColor }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full absolute inset-0 m-auto border-2 border-slate-950 shadow-md"
                  style={{ backgroundColor: strokeColor }}
                />
              </div>
            )}

            {/* Interactive Cursor Tracking Dot (HTML overlay to guarantee 100% round dot) */}
            {hoveredIndex !== null && activeHoverPoint && (
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{
                  left: `${activeHoverPoint.x}%`,
                  top: `${activeHoverPoint.y}%`,
                }}
              >
                <div className="w-4 h-4 rounded-full bg-white/20 animate-ping absolute inset-0 -m-1" />
                <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-950 shadow-lg" />
              </div>
            )}
          </div>

          {/* Crosshair Cursor Hairlines */}
          {mousePos && hoveredIndex !== null && (
            <>
              {/* Vertical Crosshair Line */}
              <div
                className="absolute top-0 bottom-7 border-l border-dashed border-cyan-400/60 pointer-events-none z-10"
                style={{
                  left: `${(hoveredIndex / (safeHistory.length - 1 || 1)) * 100}%`,
                }}
              />
              {/* Horizontal Crosshair Line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-cyan-400/60 pointer-events-none z-10"
                style={{ top: `${Math.max(0, Math.min(320 - bottomTimelineHeight, mousePos.y))}px` }}
              />
            </>
          )}

          {/* X-Axis Timeline Coordinates (Bottom Row) */}
          <div className="absolute bottom-0 left-0 right-0 h-7 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between px-2.5 z-10">
            {timeTicks.map((tick, i) => (
              <span key={i} className="text-[10px] font-mono text-slate-400 font-medium">
                {tick.time}
              </span>
            ))}
          </div>
        </div>

        {/* Real Y-Axis (Price Coordinates Column on Right Edge) */}
        <div
          className="absolute top-0 right-0 bottom-7 border-l border-slate-800 bg-slate-900/90 flex flex-col justify-between py-2 px-2 select-none z-10"
          style={{ width: `${yAxisWidth}px` }}
        >
          {priceTicks.map((price, idx) => (
            <div key={idx} className="text-[10px] font-mono text-slate-400 text-right">
              ₹{price.toFixed(1)}
            </div>
          ))}

          {/* T0 Baseline Pill on Y-Axis (if in visible range) */}
          {benchmarkPrice && benchmarkYPercent !== null && (
            <div
              className="absolute right-1 transform -translate-y-1/2 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/60 text-[9px] font-mono text-sky-300 font-bold shadow pointer-events-none z-20"
              style={{ top: `${benchmarkYPercent}%` }}
            >
              T₀ ₹{benchmarkPrice.toFixed(0)}
            </div>
          )}

          {/* Current Live Price Pill on Y-Axis (dynamically tracked to real price coordinate) */}
          <div
            className={`absolute right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-md pointer-events-none z-20 transform -translate-y-1/2 transition-all duration-300 ${
              isOverallPositive
                ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300'
                : 'bg-rose-950 border border-rose-500/60 text-rose-300'
            }`}
            style={{
              top: `${Math.max(6, Math.min(94, ((maxPrice - currentPrice) / priceRange) * 100))}%`,
            }}
          >
            ₹{currentPrice.toFixed(1)}
          </div>

          {/* Active Hover Price Pill on Y-Axis (aligned with cursor scrubbing) */}
          {hoveredIndex !== null && activeHoverPoint && (
            <div
              className="absolute right-1 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10px] font-mono font-bold shadow-xl pointer-events-none z-30 transform -translate-y-1/2"
              style={{
                top: `${Math.max(6, Math.min(94, activeHoverPoint.y))}%`,
              }}
            >
              ₹{activeHoverPoint.close.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
        <span>Hover or drag along the coordinate plane to inspect historical intraday price & volume ticks.</span>
        {benchmarkPrice && (
          <span className="text-sky-400 flex items-center gap-1 self-end sm:self-center">
            <Info className="w-3.5 h-3.5" />
            <span>Session reference baseline: ₹{benchmarkPrice.toFixed(2)} ({benchmarkLabel || 'T₀'})</span>
          </span>
        )}
      </div>
    </div>
  );
}
