'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { formatINR } from '../lib/utils';
import {
  X,
  Search,
  Plus,
  Check,
  TrendingUp,
} from 'lucide-react';

interface AddTickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistId: string;
  watchlistName: string;
  existingSymbols: string[];
  onTickerAdded: () => void;
}

export function AddTickerModal({
  isOpen,
  onClose,
  watchlistId,
  watchlistName,
  existingSymbols,
  onTickerAdded,
}: AddTickerModalProps) {
  const [query, setQuery] = useState('');
  const [allSymbols, setAllSymbols] = useState<{ symbol: string; name: string; price: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setAddedSymbols(new Set(existingSymbols));
      api.searchSymbols()
        .then((data) => setAllSymbols(data))
        .catch((err) => console.error('Failed to load symbols:', err));
    }
  }, [isOpen, existingSymbols]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allSymbols;
    const q = query.toLowerCase();
    return allSymbols.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [allSymbols, query]);

  const handleAdd = async (symbol: string, name: string) => {
    try {
      setLoading(true);
      await api.addTicker(watchlistId, symbol, name);
      setAddedSymbols((prev) => new Set([...Array.from(prev), symbol]));
      onTickerAdded();
    } catch (err) {
      console.error('Failed to add ticker:', err);
    } finally {
      setLoading(false);
    }
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
            className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-slate-900/90 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                  Add Asset to Watchlist
                </h2>
                <p className="text-[11px] text-slate-400">Target: {watchlistName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-border bg-slate-900/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search NSE/BSE stocks (e.g. TATAMOTORS, INFY, TCS)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-border rounded-md text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Symbol List */}
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-border/60">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  No matching assets found.
                </div>
              ) : (
                filtered.map((item) => {
                  const isAdded = addedSymbols.has(item.symbol);
                  return (
                    <div
                      key={item.symbol}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded transition-colors"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-100 text-xs">{item.symbol}</div>
                        <div className="text-[11px] text-slate-400">{item.name}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-slate-200">
                          {formatINR(item.price)}
                        </span>
                        {isAdded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </span>
                        ) : (
                          <button
                            disabled={loading}
                            onClick={() => handleAdd(item.symbol, item.name)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-slate-900/90 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
