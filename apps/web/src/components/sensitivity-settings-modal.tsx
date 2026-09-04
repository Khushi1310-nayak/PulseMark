'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SensitivityConfig, DEFAULT_SENSITIVITY_CONFIG } from '@pulsemark/shared';
import { api } from '../lib/api';
import {
  X,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SensitivitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export function SensitivitySettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
}: SensitivitySettingsModalProps) {
  const [config, setConfig] = useState<SensitivityConfig>({ ...DEFAULT_SENSITIVITY_CONFIG });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getSettings()
        .then((data) => setConfig(data))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.updateSettings(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSettingsSaved();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_SENSITIVITY_CONFIG });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-border bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                  <Sliders className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                    Alert & Sensitivity Settings
                  </h2>
                  <p className="text-[11px] text-slate-400">Tune the multi-factor Anomaly Engine</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-xs">
              {saved && (
                <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sensitivity parameters updated successfully.</span>
                </div>
              )}

              {/* 1. Price Shift Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono">
                  <label className="font-semibold text-slate-200">Price Shift Sensitivity (Δ% vs T₀)</label>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-border">
                    ±{config.priceShiftThresholdPercent.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={config.priceShiftThresholdPercent}
                  onChange={(e) =>
                    setConfig({ ...config, priceShiftThresholdPercent: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  Minimum price delta required against your prior session snapshot to trigger a price alert.
                </p>
              </div>

              {/* 2. Volume Anomaly Multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono">
                  <label className="font-semibold text-slate-200">Volume Anomaly Multiplier</label>
                  <span className="text-amber-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-border">
                    {config.volumeAnomalyMultiplier.toFixed(1)}x 30d Avg
                  </span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="5.0"
                  step="0.1"
                  value={config.volumeAnomalyMultiplier}
                  onChange={(e) =>
                    setConfig({ ...config, volumeAnomalyMultiplier: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500"
                />
                <p className="text-[11px] text-slate-400">
                  Flags volume spikes when intraday volume exceeds this multiple of the 30-day trailing baseline.
                </p>
              </div>

              {/* 3. Range Breach Detection */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-border">
                <div>
                  <div className="font-mono font-semibold text-slate-200">Range Breach & Breakout Detection</div>
                  <div className="text-[11px] text-slate-400">
                    Flag stocks breaking session high/low or approaching 52-week extremes.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({ ...config, rangeBreachDetection: !config.rangeBreachDetection })
                  }
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.rangeBreachDetection ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      config.rangeBreachDetection ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Attention Score Gate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono">
                  <label className="font-semibold text-slate-200">Min Composite Score for Attention Desk</label>
                  <span className="text-slate-200 font-bold px-2 py-0.5 rounded bg-slate-900 border border-border">
                    {config.minAnomalyScoreForAttention} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="70"
                  step="5"
                  value={config.minAnomalyScoreForAttention}
                  onChange={(e) =>
                    setConfig({ ...config, minAnomalyScoreForAttention: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  Stocks with composite multi-factor score equal or above this will elevate to the Attention Desk.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-slate-900/90 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-slate-400 hover:text-slate-200 font-mono text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
