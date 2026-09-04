'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Watchlist, SessionSnapshot } from '@pulsemark/shared';
import { ConnectionState } from '../hooks/use-market-stream';
import { ConnectionPill } from './connection-pill';
import {
  Activity,
  Sliders,
  Sparkles,
  Layers,
  ChevronDown,
  Camera,
  Plus,
  BookOpen,
  Check,
  FolderPlus,
  Clock,
} from 'lucide-react';

interface HeaderProps {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onSelectWatchlist: (id: string) => void;
  snapshot: SessionSnapshot | null;
  connectionState: ConnectionState;
  feedHealth?: any;
  onOpenEvaluator: () => void;
  onOpenSettings: () => void;
  onOpenWatchlistManager: () => void;
  onOpenAddTicker: () => void;
  onSnapshotNow: () => void;
}

export function Header({
  watchlists,
  activeWatchlistId,
  onSelectWatchlist,
  snapshot,
  connectionState,
  feedHealth,
  onOpenEvaluator,
  onOpenSettings,
  onOpenWatchlistManager,
  onOpenAddTicker,
  onSnapshotNow,
}: HeaderProps) {
  const [isWatchlistMenuOpen, setIsWatchlistMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsWatchlistMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-slate-800/80 bg-[#070A0F]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          
          {/* Left: Brand & Animated Watchlist Switcher */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400/60 transition-all shadow-sm">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="font-bold text-base tracking-tight text-slate-100 font-sans">
                Pulse<span className="text-emerald-400">Mark</span>
              </span>
            </Link>

            <span className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Animated Watchlist Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsWatchlistMenuOpen(!isWatchlistMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-all shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate font-semibold text-slate-200">
                  {activeWatchlist?.name ?? 'Watchlist'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {activeWatchlist?.items?.length ?? 0}
                </span>
                <motion.div
                  animate={{ rotate: isWatchlistMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </motion.div>
              </button>

              {/* Animated Floating Dropdown Menu */}
              <AnimatePresence>
                {isWatchlistMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 mt-2 w-64 rounded-xl bg-[#0c1018] border border-slate-800 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-800/80 text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold flex justify-between items-center">
                      <span>Switch Watchlist</span>
                      <span>{watchlists.length} Available</span>
                    </div>

                    <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                      {watchlists.map((w) => {
                        const isSelected = w.id === activeWatchlist?.id;
                        return (
                          <button
                            key={w.id}
                            onClick={() => {
                              onSelectWatchlist(w.id);
                              setIsWatchlistMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                              isSelected
                                ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                                : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                            }`}
                          >
                            <div className="text-left truncate pr-2">
                              <div className="truncate">{w.name}</div>
                              {w.description && (
                                <div className="text-[10px] text-slate-500 truncate font-normal">
                                  {w.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-slate-500">
                                {w.items.length}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-1.5 border-t border-slate-800/80 bg-slate-950/40">
                      <button
                        onClick={() => {
                          setIsWatchlistMenuOpen(false);
                          onOpenWatchlistManager();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors font-medium"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Manage & Create Watchlists</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Middle: Compact Session Baseline Indicator */}
          <div className="hidden md:flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-slate-300">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-400">Baseline (T₀):</span>
              <span className="font-mono text-slate-200 text-[11px] font-medium">
                {snapshot?.isFirstSession
                  ? '09:15 AM Market Open'
                  : snapshot?.benchmarkLabel ?? '09:15 AM'}
              </span>
              <button
                onClick={onSnapshotNow}
                title="Snapshot current prices as new baseline"
                className="ml-1 text-slate-400 hover:text-emerald-400 p-0.5 rounded hover:bg-slate-800 transition-colors"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Telemetry, Docs, Add, Evaluator */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Feed Pill */}
            <ConnectionPill
              state={connectionState}
              source={feedHealth?.source}
              isCircuitBreakerTripped={feedHealth?.isCircuitBreakerTripped}
            />

            {/* Docs Link */}
            <Link
              href="/docs"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-emerald-400 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Docs</span>
            </Link>

            {/* Add Asset Button */}
            <button
              onClick={onOpenAddTicker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Asset</span>
            </button>

            {/* Evaluator / Simulator Trigger */}
            <button
              onClick={onOpenEvaluator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-sm"
              title="Open Evaluator Sandbox & Shocks"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulate</span>
            </button>

            {/* Settings Sensitivity */}
            <button
              onClick={onOpenSettings}
              title="Sensitivity Settings"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
