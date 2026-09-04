'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Watchlist } from '@pulsemark/shared';
import { api } from '../lib/api';
import { useMarketStream } from '../hooks/use-market-stream';
import { useSessionTracker } from '../hooks/use-session-tracker';
import { Header } from '../components/header';
import { AttentionDesk } from '../components/attention-desk';
import { WatchlistTable } from '../components/watchlist-table';
import { EvaluatorDrawer } from '../components/evaluator-drawer';
import { WatchlistManagerDrawer } from '../components/watchlist-manager-drawer';
import { SensitivitySettingsModal } from '../components/sensitivity-settings-modal';
import { AddTickerModal } from '../components/add-ticker-modal';
import {
  Activity,
  History,
  Camera,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();

  // Watchlist state
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('');

  // Modals & Drawers
  const [isEvaluatorOpen, setIsEvaluatorOpen] = useState(false);
  const [isWatchlistManagerOpen, setIsWatchlistManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddTickerOpen, setIsAddTickerOpen] = useState(false);

  // Real-time market stream & Session tracking
  const {
    ticks,
    attentionDesk,
    allEvaluations,
    snapshot,
    connectionState,
    feedHealth,
    flashStates,
    refreshSession,
  } = useMarketStream();

  useSessionTracker();

  // Load Watchlists
  const loadWatchlists = useCallback(async () => {
    try {
      const data = await api.getWatchlists();
      setWatchlists(data);
      if (data.length > 0 && !activeWatchlistId) {
        setActiveWatchlistId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load watchlists:', err);
    }
  }, [activeWatchlistId]);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  // Handle URL query parameter ?demo=evaluator
  useEffect(() => {
    if (searchParams.get('demo') === 'evaluator' || searchParams.get('demo') === 'true') {
      setIsEvaluatorOpen(true);
    }
  }, [searchParams]);

  const activeWatchlist =
    watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  const handleSnapshotNow = async () => {
    try {
      await api.commitSnapshot();
      await refreshSession();
    } catch (err) {
      console.error('Failed to commit snapshot:', err);
    }
  };

  const handleRemoveTicker = async (symbol: string) => {
    if (!activeWatchlist) return;
    try {
      const updated = await api.removeTicker(activeWatchlist.id, symbol);
      setWatchlists((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w))
      );
    } catch (err) {
      console.error('Failed to remove ticker:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col terminal-grid">
      {/* Global Header */}
      <Header
        watchlists={watchlists}
        activeWatchlistId={activeWatchlistId}
        onSelectWatchlist={(id) => setActiveWatchlistId(id)}
        snapshot={snapshot}
        connectionState={connectionState}
        feedHealth={feedHealth}
        onOpenEvaluator={() => setIsEvaluatorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWatchlistManager={() => setIsWatchlistManagerOpen(true)}
        onOpenAddTicker={() => setIsAddTickerOpen(true)}
        onSnapshotNow={handleSnapshotNow}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Session Delta Summary Banner */}
        <div className="rounded-lg border border-border bg-gradient-to-r from-slate-900/90 via-surface to-slate-900/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  Active Session Baseline (T₀)
                </span>
                {snapshot?.isFirstSession ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                    09:15 AM Market Open (First Session Today)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {snapshot?.benchmarkLabel || 'Today at 09:15 AM (Market Open)'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every price delta, volume surge, and range breach below is benchmarked against your prior session state.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={handleSnapshotNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Snapshot Current Prices</span>
            </button>
          </div>
        </div>

        {/* Top Deck: Attention Desk */}
        <div id="attention-desk">
          <AttentionDesk
            anomalies={attentionDesk}
            benchmarkLabel={snapshot?.benchmarkLabel}
            onOpenEvaluator={() => setIsEvaluatorOpen(true)}
          />
        </div>

        {/* Main Deck: High-Density Watchlist Table */}
        <div id="watchlist">
          <WatchlistTable
            evaluations={allEvaluations}
            activeWatchlist={activeWatchlist}
            flashStates={flashStates}
            onOpenAddTicker={() => setIsAddTickerOpen(true)}
            onRemoveTicker={handleRemoveTicker}
            onSelectWatchlist={(id) => setActiveWatchlistId(id)}
            watchlists={watchlists}
          />
        </div>
      </main>

      {/* Slide-over Drawers & Modals */}
      <EvaluatorDrawer
        isOpen={isEvaluatorOpen}
        onClose={() => setIsEvaluatorOpen(false)}
        onStateUpdated={() => refreshSession()}
        currentBenchmarkLabel={snapshot?.benchmarkLabel}
        isCircuitBreakerTripped={feedHealth?.isCircuitBreakerTripped}
      />

      <WatchlistManagerDrawer
        isOpen={isWatchlistManagerOpen}
        onClose={() => setIsWatchlistManagerOpen(false)}
        watchlists={watchlists}
        activeWatchlistId={activeWatchlistId}
        onSelectWatchlist={(id) => setActiveWatchlistId(id)}
        onRefreshWatchlists={loadWatchlists}
      />

      <SensitivitySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => refreshSession()}
      />

      {activeWatchlist && (
        <AddTickerModal
          isOpen={isAddTickerOpen}
          onClose={() => setIsAddTickerOpen(false)}
          watchlistId={activeWatchlist.id}
          watchlistName={activeWatchlist.name}
          existingSymbols={activeWatchlist.items.map((i) => i.symbol)}
          onTickerAdded={() => {
            loadWatchlists();
            refreshSession();
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-slate-100 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="font-mono text-sm text-slate-300">Initializing PulseMark Terminal...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
