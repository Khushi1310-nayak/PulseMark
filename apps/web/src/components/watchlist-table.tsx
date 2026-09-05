'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MeaningfulChange, Watchlist } from '@pulsemark/shared';
import { formatINR, formatPercent, formatVolume } from '../lib/utils';
import { Sparkline } from './sparkline';
import {
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Filter,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';

interface WatchlistTableProps {
  evaluations: MeaningfulChange[];
  activeWatchlist: Watchlist;
  flashStates: Record<string, 'up' | 'down' | null>;
  onOpenAddTicker: () => void;
  onRemoveTicker: (symbol: string) => void;
  onSelectWatchlist: (id: string) => void;
  watchlists: Watchlist[];
}

type FilterType = 'ALL' | 'ATTENTION' | 'GAINERS' | 'LOSERS';

export function WatchlistTable({
  evaluations,
  activeWatchlist,
  flashStates,
  onOpenAddTicker,
  onRemoveTicker,
  onSelectWatchlist,
  watchlists,
}: WatchlistTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  // Filter items in active watchlist
  const filteredItems = useMemo(() => {
    const symbolsInWatchlist = new Set(activeWatchlist?.items.map((i) => i.symbol) || []);

    return evaluations.filter((item) => {
      // Must be in active watchlist
      if (symbolsInWatchlist.size > 0 && !symbolsInWatchlist.has(item.symbol)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSymbol = item.symbol.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        if (!matchesSymbol && !matchesName) return false;
      }

      // Filter type
      if (filterType === 'ATTENTION') return item.requiresAttention;
      if (filterType === 'GAINERS') return item.priceDelta > 0;
      if (filterType === 'LOSERS') return item.priceDelta < 0;

      return true;
    });
  }, [evaluations, activeWatchlist, searchQuery, filterType]);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
      {/* Table Header & Controls Bar */}
      <div className="p-4 border-b border-border bg-surface/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Watchlist Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {watchlists.map((wl) => {
            const isActive = wl.id === activeWatchlist?.id;
            return (
              <button
                key={wl.id}
                onClick={() => onSelectWatchlist(wl.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {wl.name} ({wl.items.length})
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-slate-900/90 border border-border text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-md border border-border">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                filterType === 'ALL'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('ATTENTION')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                filterType === 'ATTENTION'
                  ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alerts
            </button>
            <button
              onClick={() => setFilterType('GAINERS')}
              className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                filterType === 'GAINERS'
                  ? 'bg-emerald-950/80 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gainers
            </button>
            <button
              onClick={() => setFilterType('LOSERS')}
              className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                filterType === 'LOSERS'
                  ? 'bg-rose-950/80 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Losers
            </button>
          </div>

          <button
            onClick={onOpenAddTicker}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Asset</span>
          </button>
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-slate-900/70 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4 font-semibold">Symbol / Asset</th>
              <th className="py-3 px-4 font-semibold text-right">Last Price</th>
              <th className="py-3 px-4 font-semibold text-right">Session Delta (Δ vs T₀)</th>
              <th className="py-3 px-4 font-semibold text-right">Day Change (24h)</th>
              <th className="py-3 px-4 font-semibold text-center">Volume Ratio</th>
              <th className="py-3 px-4 font-semibold text-center">Day Range (L - H)</th>
              <th className="py-3 px-4 font-semibold text-center">Trend (30m)</th>
              <th className="py-3 px-4 font-semibold text-center">State</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SlidersHorizontal className="w-6 h-6 text-slate-500" />
                    <span>No assets found matching the selected criteria.</span>
                    <button
                      onClick={onOpenAddTicker}
                      className="text-emerald-400 hover:underline text-xs mt-1"
                    >
                      Add an asset to this watchlist
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const flash = flashStates[item.symbol];
                const displayDeltaPercent =
                  Math.abs(item.priceDeltaPercent) > 25
                    ? item.dayChangePercent
                    : (item.priceDeltaPercent !== 0 ? item.priceDeltaPercent : item.dayChangePercent);

                const displayPriceDelta =
                  Math.abs(item.priceDeltaPercent) > 25
                    ? Number((item.currentPrice * (item.dayChangePercent / 100)).toFixed(2))
                    : item.priceDelta;

                const isPositiveDelta = displayDeltaPercent >= 0;
                const isPositiveDay = item.dayChangePercent >= 0;

                // Day range calculation
                const dayRangeSpan = item.dayHigh - item.dayLow || 1;
                const pricePositionPct = Math.min(
                  100,
                  Math.max(0, ((item.currentPrice - item.dayLow) / dayRangeSpan) * 100)
                );

                return (
                  <tr
                    key={item.symbol}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Symbol & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/stock/${item.symbol}`}
                              className="font-mono font-bold text-slate-100 hover:text-emerald-400 transition-colors"
                            >
                              {item.symbol}
                            </Link>
                            {item.requiresAttention && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-950/80 border border-amber-500/40 text-amber-300 font-semibold">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>ALERT</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block max-w-[140px]">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Last Price (With Green/Rose Flash on Tick) */}
                    <td
                      className={`py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-100 transition-colors rounded-md ${
                        flash === 'up'
                          ? 'flash-emerald'
                          : flash === 'down'
                          ? 'flash-rose'
                          : ''
                      }`}
                    >
                      {formatINR(item.currentPrice)}
                    </td>

                    {/* Session Delta (Δ vs T0) */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <div className="flex flex-col items-end">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            isPositiveDelta
                              ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-950/70 border border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {isPositiveDelta ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{formatPercent(displayDeltaPercent)}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {formatINR(displayPriceDelta, { showSign: true })}
                        </span>
                      </div>
                    </td>

                    {/* Day Change (24h) */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span
                        className={`font-mono font-medium ${
                          isPositiveDay ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatPercent(item.dayChangePercent)}
                      </span>
                    </td>

                    {/* Volume Ratio */}
                    <td className="py-3.5 px-4 text-center tabular-nums font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.volumeRatio >= 2.0
                            ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold'
                            : item.volumeRatio < 0.5
                            ? 'text-slate-400 bg-slate-900'
                            : 'text-slate-200'
                        }`}
                      >
                        {item.volumeRatio.toFixed(1)}x
                      </span>
                    </td>

                    {/* Day Range Bar */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-28 mx-auto">
                        <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-0.5">
                          <span>₹{item.dayLow.toFixed(0)}</span>
                          <span>₹{item.dayHigh.toFixed(0)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-slate-700"
                            style={{ width: '100%' }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-2 bg-emerald-400 rounded-full -translate-x-1/2"
                            style={{ left: `${pricePositionPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Sparkline */}
                    <td className="py-3.5 px-4 text-center">
                      <Sparkline
                        data={item.sparkline}
                        width={84}
                        height={26}
                        isPositive={isPositiveDelta}
                        strokeWidth={2}
                        showEndpoint={true}
                      />
                    </td>

                    {/* Data State */}
                    <td className="py-3.5 px-4 text-center font-mono text-[10px]">
                      {item.isStale ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30">
                          STALE (2m)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          LIVE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/stock/${item.symbol}`}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Deep Dive"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => onRemoveTicker(item.symbol)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
