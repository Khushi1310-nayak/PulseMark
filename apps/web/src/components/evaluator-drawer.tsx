'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import {
  X,
  Sparkles,
  Clock,
  Zap,
  Radio,
  RotateCcw,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

interface EvaluatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStateUpdated: () => void;
  onApplyState?: (data: any) => void;
  currentBenchmarkLabel?: string;
  isCircuitBreakerTripped?: boolean;
}

const TIME_TRAVEL_PRESETS = [
  {
    label: '15 Minutes Ago',
    minutes: 15,
    tag: 'Quick Absence',
    desc: 'Simulate a brief coffee break or short offline pause.',
  },
  {
    label: '2 Hours Ago',
    minutes: 120,
    tag: 'Morning Session',
    desc: 'Benchmark against early trading session open levels.',
  },
  {
    label: '4 Hours Ago',
    minutes: 240,
    tag: 'Mid-Day Check',
    desc: 'Mid-session check-in against lunch hour valuations.',
  },
  {
    label: '1 Day Ago',
    minutes: 1440,
    tag: 'Prior Day',
    desc: 'Overnight session delta comparison against yesterday’s close.',
  },
  {
    label: '3 Days Ago',
    minutes: 4320,
    tag: 'Multi-Day',
    desc: 'Assess weekend gap or multi-day absence accumulation.',
  },
  {
    label: '1 Week Ago',
    minutes: 10080,
    tag: 'Weekly Swing',
    desc: 'Full 7-day swing trading trend & breakdown analysis.',
  },
];

const PRESET_ANOMALIES = [
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    delta: 3.8,
    volRatio: 3.5,
    reason: 'Aggressive Institutional Buying Surge (+3.8%)',
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    delta: -3.2,
    volRatio: 2.8,
    reason: "Cracked Key Day's Support Level (-3.2%)",
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    delta: 1.5,
    volRatio: 4.2,
    reason: 'Unusual Volume Spike (4.2x Average)',
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    delta: -2.4,
    volRatio: 2.5,
    reason: 'Heavy Selling Pressure (-2.4%)',
  },
];

type EvaluatorTab = 'time_travel' | 'shocks' | 'resilience';

export function EvaluatorDrawer({
  isOpen,
  onClose,
  onStateUpdated,
  onApplyState,
  currentBenchmarkLabel,
  isCircuitBreakerTripped,
}: EvaluatorDrawerProps) {
  const [activeTab, setActiveTab] = useState<EvaluatorTab>('time_travel');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>('15 Minutes Ago');
  const [selectedAnomaly, setSelectedAnomaly] = useState<typeof PRESET_ANOMALIES[0] | null>(null);

  // Custom injection state
  const [customSymbol, setCustomSymbol] = useState('TCS');
  const [customDelta, setCustomDelta] = useState(3.0);
  const [customVolume, setCustomVolume] = useState(3.0);
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  // Chaos network state
  const [simulatedNetworkDrop, setSimulatedNetworkDrop] = useState(isCircuitBreakerTripped || false);
  const [forceStale, setForceStale] = useState(false);

  // "Apply & Close" Action: Immediate close, instant 0ms optimistic state, and background sync
  const handleApplyAndClose = () => {
    // 1. Immediately close drawer so the UI never feels stuck
    onClose();

    // 2. Optimistic instant state application
    if (activeTab === 'time_travel') {
      onApplyState?.({
        snapshot: {
          benchmarkLabel: selectedPresetLabel,
          isFirstSession: false,
        },
      });

      // Fire API call in background and reconcile
      api.simulateTimeTravel(selectedMinutes, selectedPresetLabel)
        .then((res) => {
          if (res && onApplyState) onApplyState(res);
          onStateUpdated();
        })
        .catch((err) => console.error('Time travel failed:', err));
    } else if (activeTab === 'shocks') {
      if (isCustomSelected) {
        api.injectVolatility(customSymbol, customDelta, customVolume, `Forced Shock ${customDelta >= 0 ? '+' : ''}${customDelta}%`)
          .then((res) => {
            if (res && onApplyState) onApplyState(res);
            onStateUpdated();
          })
          .catch((err) => console.error('Custom shock failed:', err));
      } else if (selectedAnomaly) {
        api.injectVolatility(selectedAnomaly.symbol, selectedAnomaly.delta, selectedAnomaly.volRatio, selectedAnomaly.reason)
          .then((res) => {
            if (res && onApplyState) onApplyState(res);
            onStateUpdated();
          })
          .catch((err) => console.error('Shock injection failed:', err));
      }
    } else if (activeTab === 'resilience') {
      api.simulateNetworkChaos(simulatedNetworkDrop, forceStale)
        .then((res) => {
          if (res && onApplyState) onApplyState({ feedHealth: res });
          onStateUpdated();
        })
        .catch((err) => console.error('Network chaos toggle failed:', err));
    }

    // 3. Smoothly scroll to Attention Desk on dashboard
    setTimeout(() => {
      const el = document.getElementById('attention-desk');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Reset to Market Open
  const handleReset = () => {
    onClose();
    api.resetChaos()
      .then((res) => {
        setSimulatedNetworkDrop(false);
        setForceStale(false);
        if (res && onApplyState) onApplyState(res);
        onStateUpdated();
      })
      .catch((err) => console.error('Reset failed:', err));
  };

  const getApplyButtonLabel = () => {
    if (activeTab === 'time_travel') return `Apply "${selectedPresetLabel}" & Close`;
    if (activeTab === 'shocks') {
      if (isCustomSelected) return `Apply ${customSymbol} (${customDelta >= 0 ? '+' : ''}${customDelta}%) & Close`;
      if (selectedAnomaly) return `Apply ${selectedAnomaly.symbol} Shock & Close`;
      return 'Apply Shock & Close';
    }
    if (activeTab === 'resilience') {
      return simulatedNetworkDrop ? 'Sever Network & Close' : 'Restore Network & Close';
    }
    return 'Apply & Close';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Spacious Slide-Over Modal */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col justify-between h-full overflow-hidden"
          >
            {/* Header: Title & Close */}
            <div className="p-6 border-b border-border bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide uppercase">
                    Evaluator & Simulator
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Test multi-temporal baseline diffing, volatility scenarios, and network resiliency.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spacious Segmented Tab Navigation (Making it breathe!) */}
            <div className="px-6 pt-5 pb-2 bg-slate-950/60 border-b border-border/70">
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('time_travel')}
                  className={`relative py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'time_travel' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeTab === 'time_travel' && (
                    <motion.div
                      layoutId="evaluator-active-pill"
                      className="absolute inset-0 bg-emerald-600 rounded-lg shadow-md shadow-emerald-950/40"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    />
                  )}
                  <Clock className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">1. Time Travel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('shocks')}
                  className={`relative py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'shocks' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeTab === 'shocks' && (
                    <motion.div
                      layoutId="evaluator-active-pill"
                      className="absolute inset-0 bg-amber-600 rounded-lg shadow-md shadow-amber-950/40"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    />
                  )}
                  <Zap className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">2. Market Shocks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('resilience')}
                  className={`relative py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'resilience' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeTab === 'resilience' && (
                    <motion.div
                      layoutId="evaluator-active-pill"
                      className="absolute inset-0 bg-cyan-600 rounded-lg shadow-md shadow-cyan-950/40"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    />
                  )}
                  <Radio className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">3. Chaos Resiliency</span>
                </button>
              </div>
            </div>

            {/* Content Body (Scrollable, Generous Whitespace) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: SESSION TIME TRAVEL */}
              {activeTab === 'time_travel' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
                      <span>Shift Session Baseline ($T_0$)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Zero-Mock Engine
                      </span>
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Select how far back in time to position your reference snapshot. PulseMark re-computes all volume surges, price displacements, and support breaks across that interval.
                    </p>
                  </div>

                  {/* Spacious 2-Column Grid of Big Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {TIME_TRAVEL_PRESETS.map((preset, idx) => {
                      const isSelected = selectedMinutes === preset.minutes;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedMinutes(preset.minutes);
                            setSelectedPresetLabel(preset.label);
                          }}
                          className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 group ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50'
                              : 'bg-slate-900/80 border-border hover:bg-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-bold font-mono ${
                                    isSelected ? 'text-emerald-300' : 'text-slate-100 group-hover:text-emerald-400'
                                  }`}
                                >
                                  {preset.label}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mt-1.5 inline-block">
                                {preset.tag}
                              </span>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-600 bg-slate-800 text-transparent'
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug">
                            {preset.desc}
                          </p>

                          {isSelected && (
                            <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] font-mono text-emerald-400 font-semibold">
                              <span>Ready to apply</span>
                              <span>Selected ✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: VOLATILITY SHOCKS */}
              {activeTab === 'shocks' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-1">
                    <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wide">
                      Instant Anomaly & Volatility Injection
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Force immediate volume multiples or price anomalies to watch tickers elevate to the Attention Desk.
                    </p>
                  </div>

                  {/* Preset Shock Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {PRESET_ANOMALIES.map((preset, idx) => {
                      const isUp = preset.delta > 0;
                      const isSelected = !isCustomSelected && selectedAnomaly?.symbol === preset.symbol;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedAnomaly(preset);
                            setIsCustomSelected(false);
                          }}
                          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950/50'
                              : 'bg-slate-900/80 border-border hover:bg-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-slate-100">{preset.symbol}</span>
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                isUp ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {isUp ? '+' : ''}{preset.delta}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{preset.reason}</p>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                            <span>Vol Multiple: {preset.volRatio}x</span>
                            {isSelected && <span className="text-amber-400 font-semibold">Selected ✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Parameter Injector */}
                  <div
                    className={`p-5 rounded-xl border transition-all space-y-4 ${
                      isCustomSelected
                        ? 'bg-amber-950/30 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-200 text-xs">Custom Shock Parameters</span>
                      <button
                        type="button"
                        onClick={() => setIsCustomSelected(true)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                          isCustomSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isCustomSelected ? 'Custom Active' : 'Select Custom'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1 font-mono">Stock Symbol</label>
                        <select
                          value={customSymbol}
                          onChange={(e) => {
                            setCustomSymbol(e.target.value);
                            setIsCustomSelected(true);
                          }}
                          className="w-full p-2 rounded-lg bg-slate-950 border border-border text-slate-200 font-mono text-xs"
                        >
                          <option value="TATAMOTORS">TATAMOTORS</option>
                          <option value="INFY">INFY</option>
                          <option value="TCS">TCS</option>
                          <option value="RELIANCE">RELIANCE</option>
                          <option value="HDFCBANK">HDFCBANK</option>
                          <option value="ITC">ITC</option>
                          <option value="ICICIBANK">ICICIBANK</option>
                          <option value="BHARTIARTL">BHARTIARTL</option>
                          <option value="SBIN">SBIN</option>
                          <option value="BAJFINANCE">BAJFINANCE</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1 font-mono">
                          Price Delta ({customDelta > 0 ? '+' : ''}{customDelta}%)
                        </label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          step="0.5"
                          value={customDelta}
                          onChange={(e) => {
                            setCustomDelta(parseFloat(e.target.value));
                            setIsCustomSelected(true);
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1 font-mono">
                          Volume Surge ({customVolume}x)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={customVolume}
                          onChange={(e) => {
                            setCustomVolume(parseFloat(e.target.value));
                            setIsCustomSelected(true);
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: RESILIENCE CHAOS */}
              {activeTab === 'resilience' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wide">
                      Circuit Breaker & Exchange Downtime
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Simulate network disconnects between client and exchange feeds to verify fallback to stale Redis cache.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSimulatedNetworkDrop(!simulatedNetworkDrop)}
                    className={`w-full p-5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      simulatedNetworkDrop
                        ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/30 text-rose-300'
                        : 'bg-slate-900/80 border-border text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-sm">
                        {simulatedNetworkDrop ? 'Feed Connection Severed (Tripped)' : 'Feed Online & Healthy'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {simulatedNetworkDrop
                          ? 'Serving stale Redis snapshots; heartbeat warning active.'
                          : 'Normal streaming operation via Server-Sent Events.'}
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold ${
                        simulatedNetworkDrop ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {simulatedNetworkDrop ? 'DISCONNECTED' : 'ONLINE'}
                    </div>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Spacious Footer (Generous padding, high-end CTA) */}
            <div className="p-6 border-t border-border bg-slate-900/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset (09:15 AM Open)</span>
              </button>

              <button
                type="button"
                onClick={handleApplyAndClose}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-mono font-bold text-xs shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{getApplyButtonLabel()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
