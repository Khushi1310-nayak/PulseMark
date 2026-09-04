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
  Play,
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
  { label: '15 Minutes Ago', minutes: 15, desc: 'Simulate brief absence / short coffee break' },
  { label: '2 Hours Ago', minutes: 120, desc: 'Morning session baseline comparison' },
  { label: '4 Hours Ago', minutes: 240, desc: 'Mid-day check-in baseline' },
  { label: '1 Day Ago', minutes: 1440, desc: 'Prior day closing baseline comparison' },
  { label: '3 Days Ago', minutes: 4320, desc: 'Multi-day absence comparison' },
  { label: '1 Week Ago', minutes: 10080, desc: 'Full week swing trading baseline comparison' },
];

const PRESET_ANOMALIES = [
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors',
    delta: 3.8,
    volRatio: 3.5,
    reason: 'Aggressive Institutional Buying Surge (+3.8%)',
  },
  {
    symbol: 'INFY',
    name: 'Infosys',
    delta: -3.2,
    volRatio: 2.8,
    reason: "Cracked Key Day's Support Level (-3.2%)",
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance',
    delta: 1.5,
    volRatio: 4.2,
    reason: 'Unusual Volume Spike (4.2x Average)',
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank',
    delta: -2.4,
    volRatio: 2.5,
    reason: 'Heavy Selling Pressure (-2.4%)',
  },
];

export function EvaluatorDrawer({
  isOpen,
  onClose,
  onStateUpdated,
  onApplyState,
  currentBenchmarkLabel,
  isCircuitBreakerTripped,
}: EvaluatorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selection states (Click button to select cleanly first)
  const [activeMode, setActiveMode] = useState<'time_travel' | 'anomaly' | 'custom' | 'chaos'>('time_travel');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>('15 Minutes Ago');
  const [selectedAnomaly, setSelectedAnomaly] = useState<typeof PRESET_ANOMALIES[0]>(PRESET_ANOMALIES[0]);

  // Custom injection state
  const [customSymbol, setCustomSymbol] = useState('TCS');
  const [customDelta, setCustomDelta] = useState(3.0);
  const [customVolume, setCustomVolume] = useState(3.0);

  // Chaos network state
  const [simulatedNetworkDrop, setSimulatedNetworkDrop] = useState(isCircuitBreakerTripped || false);
  const [forceStale, setForceStale] = useState(false);

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Perform Simulation
  const executeSimulation = async () => {
    if (activeMode === 'time_travel') {
      // Optimistic instant feedback: Update local benchmark label immediately with 0ms delay
      onApplyState?.({
        snapshot: {
          benchmarkLabel: selectedPresetLabel,
          isFirstSession: false,
        },
      });

      const res = await api.simulateTimeTravel(selectedMinutes, selectedPresetLabel);
      if (res && onApplyState) {
        onApplyState(res);
      }
      return `Session baseline shifted to: ${selectedPresetLabel}`;
    } else if (activeMode === 'anomaly') {
      const res = await api.injectVolatility(
        selectedAnomaly.symbol,
        selectedAnomaly.delta,
        selectedAnomaly.volRatio,
        selectedAnomaly.reason
      );
      if (res && onApplyState) {
        onApplyState(res);
      }
      return `Injected ${selectedAnomaly.delta >= 0 ? '+' : ''}${selectedAnomaly.delta}% shock into ${selectedAnomaly.symbol}`;
    } else if (activeMode === 'custom') {
      const res = await api.injectVolatility(
        customSymbol,
        customDelta,
        customVolume,
        `Forced Shock ${customDelta >= 0 ? '+' : ''}${customDelta}%`
      );
      if (res && onApplyState) {
        onApplyState(res);
      }
      return `Shocked ${customSymbol} (${customDelta >= 0 ? '+' : ''}${customDelta}%)`;
    } else if (activeMode === 'chaos') {
      const res = await api.simulateNetworkChaos(simulatedNetworkDrop, forceStale);
      if (res && onApplyState) {
        onApplyState({ feedHealth: res });
      }
      return simulatedNetworkDrop
        ? 'Simulated network drop active (Circuit breaker tripped)'
        : 'Network restored to normal';
    }
    return '';
  };

  // 1. "Apply & Close" Primary Action: Applies selected simulation and closes drawer
  const handleApplyAndClose = async () => {
    try {
      setLoading(true);
      const feedback = await executeSimulation();
      showFeedback(feedback);
      onStateUpdated();
      onClose();

      // Smooth scroll to attention desk so changes are directly visible
      setTimeout(() => {
        const el = document.getElementById('attention-desk');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      console.error('Failed to apply simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. "Apply Now" (Applies simulation while keeping drawer open)
  const handleApplyNow = async () => {
    try {
      setLoading(true);
      const feedback = await executeSimulation();
      showFeedback(feedback);
      onStateUpdated();
    } catch (err) {
      console.error('Failed to apply simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset All
  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await api.resetChaos();
      setSimulatedNetworkDrop(false);
      setForceStale(false);
      if (res && onApplyState) {
        onApplyState(res);
      }
      showFeedback('Reset state to standard market open benchmark (09:15 AM)');
      onStateUpdated();
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getApplyButtonLabel = () => {
    if (activeMode === 'time_travel') return `Apply "${selectedPresetLabel}" & Close`;
    if (activeMode === 'anomaly') return `Apply ${selectedAnomaly.symbol} Shock & Close`;
    if (activeMode === 'custom') return `Apply ${customSymbol} (${customDelta >= 0 ? '+' : ''}${customDelta}%) & Close`;
    if (activeMode === 'chaos') return simulatedNetworkDrop ? 'Sever Network & Close' : 'Restore Network & Close';
    return 'Apply & Close';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Slide-over Drawer */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border bg-slate-900/95 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                      Judge Evaluator Panel
                    </h2>
                    <p className="text-[11px] text-amber-400/90 font-mono">Select parameters, then Apply & Close</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Feedback Alert */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 flex items-center gap-2 font-mono shadow-md"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{successMessage}</span>
                  </motion.div>
                )}

                {/* Section 1: Session Time Travel */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                        1. Session Time Travel
                      </h3>
                    </div>
                    {activeMode === 'time_travel' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                        Active Selection
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                    Shift reference baseline ($T_0$) into the past. Click any duration below to select it, then click <strong className="text-emerald-300">Apply & Close</strong>.
                  </p>

                  <div className="space-y-2">
                    {TIME_TRAVEL_PRESETS.map((preset, idx) => {
                      const isSelected = activeMode === 'time_travel' && selectedMinutes === preset.minutes;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedMinutes(preset.minutes);
                            setSelectedPresetLabel(preset.label);
                            setActiveMode('time_travel');
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                              : 'bg-slate-900/90 border-border hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-600 bg-slate-800 text-transparent'
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <div>
                              <div
                                className={`font-mono font-semibold ${
                                  isSelected ? 'text-emerald-300' : 'text-slate-200 group-hover:text-emerald-400'
                                }`}
                              >
                                {preset.label}
                              </div>
                              <div className="text-[10px] text-slate-400">{preset.desc}</div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold uppercase tracking-wider">
                              Selected
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              Select →
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Volatility & Anomaly Injection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                        2. Volatility & Anomaly Shocks
                      </h3>
                    </div>
                    {activeMode === 'anomaly' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
                        Active Selection
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                    Select a stock shock preset to elevate it directly to the Attention Desk.
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {PRESET_ANOMALIES.map((preset, idx) => {
                      const isUp = preset.delta > 0;
                      const isSelected = activeMode === 'anomaly' && selectedAnomaly?.symbol === preset.symbol;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedAnomaly(preset);
                            setActiveMode('anomaly');
                          }}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/30'
                              : 'bg-slate-900/90 border-border hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                                  isSelected
                                    ? 'bg-amber-500 border-amber-400 text-slate-950'
                                    : 'border-slate-600 bg-slate-800 text-transparent'
                                }`}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span
                                className={`font-mono font-bold ${
                                  isSelected ? 'text-amber-200' : 'text-slate-200'
                                }`}
                              >
                                {preset.symbol}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                isUp ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {preset.delta}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-2 font-mono">
                            Vol: {preset.volRatio}x | {isUp ? 'Surge' : 'Crack'}
                          </div>
                          {isSelected && (
                            <div className="mt-1 text-[9px] font-mono text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                              <span>Selected</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Parameter Injector */}
                  <div
                    className={`p-3 rounded-lg border transition-all space-y-2.5 ${
                      activeMode === 'custom'
                        ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-semibold text-slate-300 text-[11px]">Custom Shock Injector</div>
                      {activeMode === 'custom' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Ticker</label>
                        <select
                          value={customSymbol}
                          onChange={(e) => {
                            setCustomSymbol(e.target.value);
                            setActiveMode('custom');
                          }}
                          className="w-full p-1.5 rounded bg-slate-950 border border-border text-slate-200 font-mono text-xs"
                        >
                          <option value="TCS">TCS</option>
                          <option value="TATAMOTORS">TATAMOTORS</option>
                          <option value="INFY">INFY</option>
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
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Shock ({customDelta > 0 ? '+' : ''}{customDelta}%)
                        </label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          step="0.5"
                          value={customDelta}
                          onChange={(e) => {
                            setCustomDelta(parseFloat(e.target.value));
                            setActiveMode('custom');
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Vol ({customVolume}x)</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={customVolume}
                          onChange={(e) => {
                            setCustomVolume(parseFloat(e.target.value));
                            setActiveMode('custom');
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMode('custom')}
                      className={`w-full py-1.5 px-3 rounded font-mono font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        activeMode === 'custom'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{activeMode === 'custom' ? 'Custom Shock Selected' : 'Select Custom Shock'}</span>
                    </button>
                  </div>
                </div>

                {/* Section 3: Circuit-Breaker & Resilience Chaos */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                      3. Circuit-Breaker & Network Chaos
                    </h3>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                    Test system behavior during exchange outages by simulating SSE disconnection and stale fallback.
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        const newDrop = !simulatedNetworkDrop;
                        setSimulatedNetworkDrop(newDrop);
                        setActiveMode('chaos');
                      }}
                      className={`w-full p-3 rounded-lg border transition-all text-left flex items-center justify-between ${
                        simulatedNetworkDrop
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40'
                          : 'bg-slate-900/90 border-border text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-semibold">
                          {simulatedNetworkDrop ? 'Network Severed (Chaos Active)' : 'Simulate Network Disconnect'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {simulatedNetworkDrop
                            ? 'Circuit breaker active: serving from stale cache'
                            : 'Trips circuit breaker to test fallback handling'}
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs px-2.5 py-1 rounded font-bold ${
                          simulatedNetworkDrop ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {simulatedNetworkDrop ? 'DISCONNECTED' : 'CONNECTED'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-slate-900/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset All (09:15 AM)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleApplyNow}
                    title="Apply changes and keep drawer open"
                    className="flex-1 sm:flex-initial px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-mono font-medium text-xs transition-all hover:border-slate-500"
                  >
                    Apply Now
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleApplyAndClose}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>{getApplyButtonLabel()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
