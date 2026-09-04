import {
  Watchlist,
  SessionSnapshot,
  AuditLogEntry,
  SensitivityConfig,
  DEFAULT_SENSITIVITY_CONFIG,
  BenchmarkPricePoint,
} from '@pulsemark/shared';
import { getPrismaClient } from './prisma.js';

export interface InMemoryStoreData {
  watchlists: Map<string, Watchlist>;
  snapshots: Map<string, SessionSnapshot>;
  auditLogs: AuditLogEntry[];
  settings: SensitivityConfig;
}

const DEFAULT_USER_ID = 'demo-user-groww';

// Initial preloaded watchlists with top Indian equities
const INITIAL_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-tech-leaders',
    name: 'Tech & Heavyweights',
    description: 'Premier Indian IT & Conglomerate Leaders',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', orderIndex: 0, addedAt: new Date().toISOString() },
      { symbol: 'INFY', name: 'Infosys Limited', orderIndex: 1, addedAt: new Date().toISOString() },
      { symbol: 'TCS', name: 'Tata Consultancy Services', orderIndex: 2, addedAt: new Date().toISOString() },
      { symbol: 'RELIANCE', name: 'Reliance Industries', orderIndex: 3, addedAt: new Date().toISOString() },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', orderIndex: 4, addedAt: new Date().toISOString() },
      { symbol: 'ITC', name: 'ITC Limited', orderIndex: 5, addedAt: new Date().toISOString() },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', orderIndex: 6, addedAt: new Date().toISOString() },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', orderIndex: 7, addedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'wl-banking-finance',
    name: 'Banking & Financials',
    description: 'High liquidity banking & NBFC watch',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', orderIndex: 0, addedAt: new Date().toISOString() },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', orderIndex: 1, addedAt: new Date().toISOString() },
      { symbol: 'SBIN', name: 'State Bank of India', orderIndex: 2, addedAt: new Date().toISOString() },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', orderIndex: 3, addedAt: new Date().toISOString() },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', orderIndex: 4, addedAt: new Date().toISOString() },
      { symbol: 'AXISBANK', name: 'Axis Bank Ltd', orderIndex: 5, addedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'wl-auto-manufacturing',
    name: 'Auto & Industrials',
    description: 'High beta cyclical & manufacturing giants',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', orderIndex: 0, addedAt: new Date().toISOString() },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India', orderIndex: 1, addedAt: new Date().toISOString() },
      { symbol: 'M&M', name: 'Mahindra & Mahindra', orderIndex: 2, addedAt: new Date().toISOString() },
      { symbol: 'LT', name: 'Larsen & Toubro', orderIndex: 3, addedAt: new Date().toISOString() },
      { symbol: 'TITAN', name: 'Titan Company Ltd', orderIndex: 4, addedAt: new Date().toISOString() },
      { symbol: 'SUNPHARMA', name: 'Sun Pharma Industries', orderIndex: 5, addedAt: new Date().toISOString() },
    ],
  },
];

class MemoryStore {
  public watchlists: Map<string, Watchlist> = new Map();
  public snapshots: Map<string, SessionSnapshot> = new Map();
  public auditLogs: AuditLogEntry[] = [];
  public settings: SensitivityConfig = { ...DEFAULT_SENSITIVITY_CONFIG };

  constructor() {
    INITIAL_WATCHLISTS.forEach((wl) => this.watchlists.set(wl.id, wl));
  }

  // Watchlists
  public getWatchlists(): Watchlist[] {
    return Array.from(this.watchlists.values());
  }

  public getWatchlist(id: string): Watchlist | undefined {
    return this.watchlists.get(id);
  }

  public createWatchlist(name: string, description?: string): Watchlist {
    const id = `wl-${Date.now()}`;
    const newWl: Watchlist = {
      id,
      name,
      description,
      isDefault: false,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.watchlists.set(id, newWl);
    return newWl;
  }

  public updateWatchlist(id: string, updates: Partial<Watchlist>): Watchlist | null {
    const existing = this.watchlists.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.watchlists.set(id, updated);
    return updated;
  }

  public deleteWatchlist(id: string): boolean {
    return this.watchlists.delete(id);
  }

  public addItemToWatchlist(watchlistId: string, symbol: string, name: string): Watchlist | null {
    const wl = this.watchlists.get(watchlistId);
    if (!wl) return null;
    if (wl.items.some((i) => i.symbol === symbol)) return wl;

    const newItem = {
      symbol,
      name,
      orderIndex: wl.items.length,
      addedAt: new Date().toISOString(),
    };
    wl.items.push(newItem);
    wl.updatedAt = new Date().toISOString();
    this.watchlists.set(watchlistId, wl);
    return wl;
  }

  public removeItemFromWatchlist(watchlistId: string, symbol: string): Watchlist | null {
    const wl = this.watchlists.get(watchlistId);
    if (!wl) return null;
    wl.items = wl.items.filter((i) => i.symbol !== symbol);
    wl.updatedAt = new Date().toISOString();
    this.watchlists.set(watchlistId, wl);
    return wl;
  }

  // Snapshots
  public getSnapshot(userId: string = DEFAULT_USER_ID): SessionSnapshot | undefined {
    return this.snapshots.get(userId);
  }

  public setSnapshot(userId: string = DEFAULT_USER_ID, snapshot: SessionSnapshot): void {
    this.snapshots.set(userId, snapshot);
  }

  // Audit Logs
  public addAuditLog(entry: Omit<AuditLogEntry, 'id'>): AuditLogEntry {
    const log: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...entry,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
    return log;
  }

  public getAuditLogs(symbol?: string): AuditLogEntry[] {
    if (symbol) {
      return this.auditLogs.filter((l) => l.symbol === symbol);
    }
    return this.auditLogs;
  }

  // Settings
  public getSettings(): SensitivityConfig {
    return this.settings;
  }

  public updateSettings(config: Partial<SensitivityConfig>): SensitivityConfig {
    this.settings = { ...this.settings, ...config };
    return this.settings;
  }
}

export const store = new MemoryStore();
export { DEFAULT_USER_ID };
