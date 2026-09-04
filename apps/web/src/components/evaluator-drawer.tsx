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
  AlertTriangle,
  Flame,
  ShieldAlert,
} from 'lucide-react';

interface EvaluatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStateUpdated: () => void;
  currentBenchmarkLabel?: string;
  isCircuitBreakerTripped?: boolean;
}

const TIME_TRAVEL_PRESETS = [
  { label: '15 Minutes Ago', minutes: 15, desc: 'Simulate brief absence / short coffee break' },
  { label: '2 Hours Ago (09:15 AM)', minutes: 120, desc: 'Market open baseline session' },
  { label: '4 Hours Ago', minutes: 240, desc: 'Mid-day check-in' },
  { label: '1 Day Ago (Yesterday Close)', minutes: 1440, desc: 'Overnight session delta comparison' },
  { label: '3 Days Ago (Post-Weekend)', minutes: 4320, desc: 'Multi-day absence comparison' },
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
  currentBenchmarkLabel,
  isCircuitBreakerTripped,
}: EvaluatorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Custom injection state
  const [customSymbol, setCustomSymbol] = useState('TCS');
  const [customDelta, setCustomDelta] = useState(3.0);
  const [customVolume, setCustomVolume] = useState(3.0);

  // Chaos network state
  const [simulatedNetworkDrop, setSimulatedNetworkDrop] = useState(false);
  const [forceStale, setForceStale] = useState(false);

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleTimeTravel = async (minutes: number, label: string) => {
    try {
      setLoading(true);
      await api.simulateTimeTravel(minutes, `Simulated: ${label}`);
      showFeedback(`Time traveled to ${label}`);
      onStateUpdated();
    } catch (err) {
      console.error('Time travel failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInjectPreset = async (preset: typeof PRESET_ANOMALIES[0]) => {
    try {
      setLoading(true);
      await api.injectVolatility(preset.symbol, preset.delta, preset.volRatio, preset.reason);
      showFeedback(`Injected ${preset.delta >= 0 ? '+' : ''}${preset.delta}% into ${preset.symbol}`);
      onStateUpdated();
    } catch (err) {
      console.error('Shock injection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomInject = async () => {
    try {
      setLoading(true);
      await api.injectVolatility(
        customSymbol,
        customDelta,
        customVolume,
        `Forced Shock ${customDelta >= 0 ? '+' : ''}${customDelta}%`
      );
      showFeedback(`Shocked ${customSymbol} (${customDelta >= 0 ? '+' : ''}${customDelta}%)`);
      onStateUpdated();
    } catch (err) {
      console.error('Custom injection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChaos = async (drop: boolean, stale: boolean) => {
    try {
      setLoading(true);
      setSimulatedNetworkDrop(drop);
      setForceStale(stale);
      await api.simulateNetworkChaos(drop, stale);
      showFeedback(drop ? 'Simulated network drop active (Circuit breaker tripped)' : 'Network restored');
      onStateUpdated();
    } catch (err) {
      console.error('Network chaos toggle failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await api.resetChaos();
      setSimulatedNetworkDrop(false);
      setForceStale(false);
      showFeedback('Reset state to default market open benchmark (09:15 AM)');
      onStateUpdated();
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setLoading(false);
    }
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
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
              <div className="p-5 border-b border-border bg-slate-900/90 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-7 h-7 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                      Judge Evaluator Panel
                    </h2>
                    <p className="text-[11px] text-amber-400 font-mono">Simulate Time Travel & Market Shocks</p>
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
                    className="p-3 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 font-mono"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                {/* Section 1: Session Time Travel */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                      1. Session Time Travel
                    </h3>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3">
                    Shift the reference snapshot ($T_0$) into the past to prove multi-dimensional delta diffing across various user absence durations.
                  </p>

                  <div className="space-y-2">
                    {TIME_TRAVEL_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        disabled={loading}
                        onClick={() => handleTimeTravel(preset.minutes, preset.label)}
                        className="w-full text-left p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-border hover:border-emerald-500/40 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-mono font-semibold text-slate-200 group-hover:text-emerald-400">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-slate-500">{preset.desc}</div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Travel →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2: Volatility & Anomaly Injection */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                      2. Volatility & Anomaly Injection
                    </h3>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3">
                    Inject instantaneous price shocks or volume spikes to watch stocks instantly elevate into the <strong className="text-slate-200">Attention Desk</strong> with live Framer Motion layout animations.
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {PRESET_ANOMALIES.map((preset, idx) => {
                      const isUp = preset.delta > 0;
                      return (
                        <button
                          key={idx}
                          disabled={loading}
                          onClick={() => handleInjectPreset(preset)}
                          className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-border hover:border-amber-500/40 text-left transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-200">{preset.symbol}</span>
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                isUp ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {preset.delta}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            Vol: {preset.volRatio}x | {isUp ? 'Surge' : 'Crack'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Parameter Injector */}
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="font-mono font-semibold text-slate-300 text-[11px]">Custom Shock Injector</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Ticker</label>
                        <select
                          value={customSymbol}
                          onChange={(e) => setCustomSymbol(e.target.value)}
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
                        <label className="text-[10px] text-slate-400 block mb-1">Shock ({customDelta > 0 ? '+' : ''}{customDelta}%)</label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          step="0.5"
                          value={customDelta}
                          onChange={(e) => setCustomDelta(parseFloat(e.target.value))}
                          className="w-full accent-amber-500"
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
                          onChange={(e) => setCustomVolume(parseFloat(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                    <button
                      disabled={loading}
                      onClick={handleCustomInject}
                      className="w-full py-1.5 px-3 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-mono font-medium text-xs transition-colors"
                    >
                      Fire Custom Shock
                    </button>
                  </div>
                </div>

                {/* Section 3: Circuit-Breaker & Resilience Chaos */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                      3. Circuit-Breaker & Network Chaos
                    </h3>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3">
                    Demonstrate readiness for exchange downtime: simulate SSE connection drops and fallback to stale Redis cache or synthetic feed.
                  </p>

                  <div className="space-y-2">
                    <button
                      disabled={loading}
                      onClick={() => handleToggleChaos(!simulatedNetworkDrop, false)}
                      className={`w-full p-2.5 rounded-lg border transition-all text-left flex items-center justify-between ${
                        simulatedNetworkDrop
                          ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                          : 'bg-slate-900/90 border-border text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-semibold">
                          {simulatedNetworkDrop ? 'Network Severed (Chaos Active)' : 'Simulate Network Disconnect'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {simulatedNetworkDrop
                            ? 'Circuit breaker active: serving from stale cache'
                            : 'Trips circuit breaker to test fallback handling'}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold">
                        {simulatedNetworkDrop ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-slate-900/90 flex items-center justify-between gap-3">
                <button
                  disabled={loading}
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All (09:15 AM)</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
