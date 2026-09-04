'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Watchlist } from '@pulsemark/shared';
import { api } from '../lib/api';
import {
  X,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';

interface WatchlistManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onSelectWatchlist: (id: string) => void;
  onRefreshWatchlists: () => void;
}

export function WatchlistManagerDrawer({
  isOpen,
  onClose,
  watchlists,
  activeWatchlistId,
  onSelectWatchlist,
  onRefreshWatchlists,
}: WatchlistManagerDrawerProps) {
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDesc, setNewWatchlistDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;

    try {
      const created = await api.createWatchlist(newWatchlistName.trim(), newWatchlistDesc.trim());
      setNewWatchlistName('');
      setNewWatchlistDesc('');
      setIsCreating(false);
      onRefreshWatchlists();
      onSelectWatchlist(created.id);
    } catch (err) {
      console.error('Failed to create watchlist:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await api.updateWatchlist(id, { name: editingName.trim() });
      setEditingId(null);
      onRefreshWatchlists();
    } catch (err) {
      console.error('Failed to update watchlist:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (watchlists.length <= 1) {
      alert('Cannot delete the only watchlist');
      return;
    }
    if (!confirm('Are you sure you want to delete this watchlist?')) return;

    try {
      await api.deleteWatchlist(id);
      onRefreshWatchlists();
      if (activeWatchlistId === id) {
        const remaining = watchlists.filter((w) => w.id !== id);
        if (remaining[0]) {
          onSelectWatchlist(remaining[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to delete watchlist:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-border bg-slate-900/90 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-7 h-7 rounded bg-slate-800 border border-slate-700 text-slate-200">
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                      Watchlist Manager
                    </h2>
                    <p className="text-[11px] text-slate-400">Organize & switch your asset decks</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* Watchlists List */}
                <div className="space-y-2.5">
                  {watchlists.map((wl) => {
                    const isActive = wl.id === activeWatchlistId;
                    const isEditing = editingId === wl.id;

                    return (
                      <div
                        key={wl.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-slate-900/90 border-emerald-500/50 shadow-sm'
                            : 'bg-slate-900/50 border-border hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {isActive ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <button
                                onClick={() => {
                                  onSelectWatchlist(wl.id);
                                }}
                                className="w-4 h-4 rounded-full border border-slate-600 hover:border-emerald-400 shrink-0"
                              />
                            )}

                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono focus:outline-none"
                                />
                                <button
                                  onClick={() => handleUpdate(wl.id)}
                                  className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer flex-1"
                                onClick={() => onSelectWatchlist(wl.id)}
                              >
                                <span className="font-mono font-semibold text-slate-100 text-xs">
                                  {wl.name}
                                </span>
                                {wl.description && (
                                  <p className="text-[10px] text-slate-400 truncate">{wl.description}</p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {wl.items.length} assets
                            </span>
                            {!isEditing && (
                              <button
                                onClick={() => {
                                  setEditingId(wl.id);
                                  setEditingName(wl.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            {watchlists.length > 1 && (
                              <button
                                onClick={() => handleDelete(wl.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List of tickers inside this watchlist */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                          {wl.items.length === 0 ? (
                            <span className="text-[10px] text-slate-500 italic">No tickers added yet</span>
                          ) : (
                            wl.items.map((item) => (
                              <span
                                key={item.symbol}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60"
                              >
                                {item.symbol}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Create New Watchlist Form */}
                {isCreating ? (
                  <form onSubmit={handleCreate} className="p-3.5 rounded-lg bg-slate-900 border border-emerald-500/30 space-y-2.5">
                    <div className="font-mono font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>New Watchlist</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Watchlist name (e.g. Energy & Utilities)"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-border rounded text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Optional description"
                      value={newWatchlistDesc}
                      onChange={(e) => setNewWatchlistDesc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-border rounded text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="px-3 py-1 rounded text-slate-400 hover:text-slate-200 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newWatchlistName.trim()}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900/60 text-slate-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Create New Watchlist</span>
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-slate-900/90 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
