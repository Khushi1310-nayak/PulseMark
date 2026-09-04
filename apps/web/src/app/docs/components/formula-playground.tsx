'use client';

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  RotateCcw,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  evaluateStockAnomaly,
  DEFAULT_SENSITIVITY_CONFIG,
  StockTick,
  BenchmarkPricePoint,
} from '@pulsemark/shared';

type PresetType = 'default' | 'squeeze' | 'crash' | 'calm';

export function FormulaPlayground() {
  const [priceDeltaPercent, setPriceDeltaPercent] = useState<number>(2.4);
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(2.2);
  const [brokeRange, setBrokeRange] = useState<boolean>(true);
  const [vwapDivergence, setVwapDivergence] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<PresetType>('default');

  // Execute canonical quantitative evaluator logic from @pulsemark/shared
  const calculation = useMemo(() => {
    const basePrice = 1000;
    const currentPrice = Number((basePrice * (1 + priceDeltaPercent / 100)).toFixed(2));

    // Session baseline coordinates at prior exit (T0)
    const benchmark: BenchmarkPricePoint = {
      price: basePrice,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      dayHigh: 1015,
      dayLow: 985,
      vwap: 1000,
      volume: 20000,
    };

    // Current live tick coordinates based on interactive inputs
    const tick: StockTick = {
      symbol: 'TATAMOTORS.NS',
      name: 'Tata Motors Limited',
      price: currentPrice,
      openPrice: 1000,
      prevClose: 1000,
      change24h: Number((currentPrice - 1000).toFixed(2)),
      change24hPercent: priceDeltaPercent,
      dayHigh: brokeRange && priceDeltaPercent >= 0 ? currentPrice + 2 : 1010,
      dayLow: brokeRange && priceDeltaPercent < 0 ? currentPrice - 2 : 990,
      week52High: 1120,
      week52Low: 720,
      volume: Math.round(150000 * volumeMultiplier),
      avgVolume30d: 150000 * 6.5,
      volumeRatio: volumeMultiplier,
      vwap: vwapDivergence
        ? Number((currentPrice * (priceDeltaPercent >= 0 ? 0.97 : 1.03)).toFixed(2))
        : currentPrice,
      bidPrice: Number((currentPrice - 0.05).toFixed(2)),
      askPrice: Number((currentPrice + 0.10).toFixed(2)),
      spread: 0.15,
      timestamp: new Date().toISOString(),
      sparkline: [990, 995, 1000, 1005, currentPrice],
    };

    // Directly call the shared pure evaluator function
    const evaluation = evaluateStockAnomaly(tick, benchmark, DEFAULT_SENSITIVITY_CONFIG);

    // Map each triggered factor to its quantitative points and category
    const reasonsWithPoints = evaluation.reasons.map((r) => {
      let points = 0;
      let category = 'FACTOR';

      if (r.type === 'PRICE_SURGE' || r.type === 'PRICE_DROP') {
        points = r.severity === 'critical' ? 45 : 30;
        category = 'PRICE DISPLACEMENT';
      } else if (r.type === 'VOLUME_SPIKE') {
        points = r.severity === 'critical' ? 35 : 25;
        category = 'VOLUME EXPANSION';
      } else if (r.type === 'RESISTANCE_BREAKOUT') {
        points = 25;
        category = 'STRUCTURAL BREAKOUT';
      } else if (r.type === 'SUPPORT_BREAK') {
        points = 30;
        category = 'SUPPORT BREAKDOWN';
      } else if (r.type === 'VWAP_DIVERGENCE') {
        points = 15;
        category = 'MEAN REVERSION';
      } else if (r.type === 'SPREAD_COMPRESSION') {
        points = 10;
        category = 'ORDER BOOK';
      } else {
        points = 10;
        category = 'TECHNICAL SHIFT';
      }

      return {
        ...r,
        points,
        category,
      };
    });

    let tier: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'NORMAL' = 'NORMAL';
    if (evaluation.anomalyScore >= 65 || evaluation.reasons.some((r) => r.severity === 'critical')) {
      tier = 'CRITICAL';
    } else if (evaluation.anomalyScore >= 40) {
      tier = 'HIGH';
    } else if (evaluation.anomalyScore >= 20) {
      tier = 'ELEVATED';
    }

    return {
      finalScore: evaluation.anomalyScore,
      tier,
      requiresAttention: evaluation.requiresAttention,
      reasons: reasonsWithPoints,
      currentPrice,
    };
  }, [priceDeltaPercent, volumeMultiplier, brokeRange, vwapDivergence]);

  // Apply scenario presets
  const applyPreset = (preset: PresetType) => {
    setActivePreset(preset);
    switch (preset) {
      case 'default':
        setPriceDeltaPercent(2.4);
        setVolumeMultiplier(2.2);
        setBrokeRange(true);
        setVwapDivergence(false);
        break;
      case 'squeeze':
        setPriceDeltaPercent(4.2);
        setVolumeMultiplier(3.5);
        setBrokeRange(true);
        setVwapDivergence(true);
        break;
      case 'crash':
        setPriceDeltaPercent(-3.8);
        setVolumeMultiplier(3.2);
        setBrokeRange(true);
        setVwapDivergence(false);
        break;
      case 'calm':
        setPriceDeltaPercent(0.4);
        setVolumeMultiplier(0.9);
        setBrokeRange(false);
        setVwapDivergence(false);
        break;
    }
  };

  const handlePriceNudge = (delta: number) => {
    setPriceDeltaPercent((prev) => {
      const next = Number((prev + delta).toFixed(1));
      return Math.max(-6.0, Math.min(6.0, next));
    });
  };

  const handleVolumeNudge = (delta: number) => {
    setVolumeMultiplier((prev) => {
      const next = Number((prev + delta).toFixed(1));
      return Math.max(0.2, Math.min(5.0, next));
    });
  };

  const getTierBadge = () => {
    switch (calculation.tier) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-950/30">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            CRITICAL ANOMALY (ATTENTION DESK)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-950/30">
            <Zap className="w-3.5 h-3.5" />
            HIGH ALERT (ATTENTION DESK)
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Activity className="w-3.5 h-3.5" />
            ELEVATED VOLATILITY
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            TRADING NORMALLY (WATCHLIST)
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0e1320] via-[#0b0e17] to-[#080a10] p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              Interactive Anomaly Heuristic Playground
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Model
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Adjust real-time market parameters or trigger preset scenarios to evaluate how the quantitative model scores volatility anomalies and promotes tickers to the Attention Desk.
          </p>
        </div>

        <div className="self-start md:self-center shrink-0">{getTierBadge()}</div>
      </div>

      {/* Preset Scenarios Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Market Scenarios
          </span>
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Preset 1 */}
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              activePreset === 'default'
                ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Baseline Surge
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-emerald-400 font-bold">
                +2.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              2.2x volume surge piercing prior session high.
            </p>
          </button>

          {/* Preset 2 */}
          <button
            type="button"
            onClick={() => applyPreset('squeeze')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              activePreset === 'squeeze'
                ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/30'
                : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                Short Squeeze
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-rose-400 font-bold">
                +4.2%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Institutional breakout with 3.5x volume & VWAP stretch.
            </p>
          </button>

          {/* Preset 3 */}
          <button
            type="button"
            onClick={() => applyPreset('crash')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              activePreset === 'crash'
                ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/30'
                : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                Support Breakdown
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-rose-400 font-bold">
                -3.8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Heavy 3.2x liquidation piercing through day&apos;s support.
            </p>
          </button>

          {/* Preset 4 */}
          <button
            type="button"
            onClick={() => applyPreset('calm')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              activePreset === 'calm'
                ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30 shadow-lg shadow-blue-950/30'
                : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Quiet Rangebound
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-blue-400 font-bold">
                +0.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Sub-baseline trading inside normal volatility bands.
            </p>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Parameters */}
        <div className="lg:col-span-7 space-y-6">
          {/* Parameter 1: Price Delta */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-slate-200 text-sm block">
                  Price Delta vs. Session Baseline (T₀)
                </label>
                <span className="text-[11px] text-slate-400">
                  Evaluated relative to logout benchmark (₹1,000.00)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-slate-800/80 border border-slate-700/60 p-0.5">
                  <button
                    type="button"
                    onClick={() => handlePriceNudge(-0.5)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
                    title="Decrease by 0.5%"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriceNudge(0.5)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
                    title="Increase by 0.5%"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span
                  className={`font-mono font-bold text-sm px-3 py-1 rounded-lg border tabular-nums ${
                    priceDeltaPercent >= 0
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {priceDeltaPercent > 0 ? '+' : ''}
                  {priceDeltaPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <input
                type="range"
                min="-6.0"
                max="6.0"
                step="0.1"
                value={priceDeltaPercent}
                onChange={(e) => {
                  setPriceDeltaPercent(parseFloat(e.target.value));
                  setActivePreset('default');
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span className="text-rose-400/80">▼ -6.0% (Severe Drop)</span>
                <span className="text-slate-400">0.0% (Par)</span>
                <span className="text-emerald-400/80">▲ +6.0% (Strong Surge)</span>
              </div>
            </div>
          </div>

          {/* Parameter 2: Volume Multiplier */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-slate-200 text-sm block">
                  Volume Velocity vs. 30-Day Mean
                </label>
                <span className="text-[11px] text-slate-400">
                  Rate of turnover vs expected hourly baseline
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-slate-800/80 border border-slate-700/60 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleVolumeNudge(-0.5)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
                    title="Decrease by 0.5x"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVolumeNudge(0.5)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
                    title="Increase by 0.5x"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-mono font-bold text-sm px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 tabular-nums">
                  {volumeMultiplier.toFixed(1)}x normal
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <input
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={volumeMultiplier}
                onChange={(e) => {
                  setVolumeMultiplier(parseFloat(e.target.value));
                  setActivePreset('default');
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span className="text-slate-400">0.2x (Liquidity Vacuum)</span>
                <span className="text-slate-400">1.0x (Average)</span>
                <span className="text-amber-400/80">5.0x (Institutional Surge)</span>
              </div>
            </div>
          </div>

          {/* Structural Flags (Rich Toggle Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Range Breach Toggle Card */}
            <button
              type="button"
              onClick={() => {
                setBrokeRange((prev) => !prev);
                setActivePreset('default');
              }}
              className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                brokeRange
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${brokeRange ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-sm font-semibold text-slate-200">Session Range Breach</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Pierced previous session high or collapsed through support low.
                </p>
              </div>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  brokeRange ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    brokeRange ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            {/* VWAP Extension Toggle Card */}
            <button
              type="button"
              onClick={() => {
                setVwapDivergence((prev) => !prev);
                setActivePreset('default');
              }}
              className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                vwapDivergence
                  ? 'bg-slate-900/90 border-blue-500/50 shadow-lg shadow-blue-950/20'
                  : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${vwapDivergence ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="text-sm font-semibold text-slate-200">VWAP Divergence</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Stretched &gt; 1.5% away from intraday volume-weighted average price.
                </p>
              </div>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  vwapDivergence ? 'bg-blue-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    vwapDivergence ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Live Output & Scoring Telemetry */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
          {/* Composite Score Display */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  Composite Anomaly Score
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Formula: ∑ w_i · φ_i (0 to 100)</span>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-black text-slate-100 tracking-tight">
                  {calculation.finalScore}
                </span>
                <span className="text-sm text-slate-500 font-semibold">/100</span>
              </div>
            </div>

            {/* Score Visual Bar */}
            <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/40">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  calculation.finalScore >= 65
                    ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                    : calculation.finalScore >= 40
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : calculation.finalScore >= 20
                    ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                }`}
                style={{ width: `${calculation.finalScore}%` }}
              />
            </div>
          </div>

          {/* Destination View Routing Card */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-1.5 transition-colors ${
              calculation.requiresAttention
                ? 'bg-amber-950/20 border-amber-500/30'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-400 font-medium">Destination Routing:</span>
              <span className="font-mono font-bold">
                {calculation.requiresAttention ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Attention Desk (Promoted)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Watchlist Matrix (Normal)
                  </span>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {calculation.requiresAttention
                ? 'Score exceeds threshold (≥ 35) or critical breach triggered. Ranked and promoted to active Attention Desk with human-readable rationale chips.'
                : 'Asset volatility within expected statistical bounds. Remains in standard Watchlist Matrix.'}
            </p>
          </div>

          {/* Active Factor Triggers (Spacious, Clear List) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
                Active Factor Triggers ({calculation.reasons.length})
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {calculation.reasons.length > 0 ? 'Contributing Weights' : 'Quiet State'}
              </span>
            </div>

            {calculation.reasons.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-800 text-center space-y-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                <div className="text-xs font-medium text-slate-300">Market Operating Normally</div>
                <p className="text-[11px] text-slate-500">
                  No anomalous price displacement, volume surge, or boundary breaches detected against session baseline.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {calculation.reasons.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                          {r.category}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{r.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{r.description}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          r.severity === 'critical'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : r.severity === 'high'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        +{r.points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
