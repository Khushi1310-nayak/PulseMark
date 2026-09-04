import {
  Watchlist,
  SessionSnapshot,
  MeaningfulChange,
  SensitivityConfig,
  StockDeepDiveResponse,
} from '@pulsemark/shared';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const API_BASE = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  const targetUrl = API_BASE ? `${API_BASE}${normalizedUrl}` : normalizedUrl;
  const res = await fetch(targetUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API error ${res.status}: ${errBody}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Watchlists
  async getWatchlists(): Promise<Watchlist[]> {
    return fetchJson<Watchlist[]>('/api/watchlists');
  },

  async searchSymbols(): Promise<{ symbol: string; name: string; price: number }[]> {
    return fetchJson<{ symbol: string; name: string; price: number }[]>('/api/watchlists/search-symbols');
  },

  async createWatchlist(name: string, description?: string): Promise<Watchlist> {
    return fetchJson<Watchlist>('/api/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  async updateWatchlist(id: string, updates: Partial<Watchlist>): Promise<Watchlist> {
    return fetchJson<Watchlist>(`/api/watchlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteWatchlist(id: string): Promise<void> {
    return fetchJson<void>(`/api/watchlists/${id}`, {
      method: 'DELETE',
    });
  },

  async addTicker(watchlistId: string, symbol: string, name?: string): Promise<Watchlist> {
    return fetchJson<Watchlist>(`/api/watchlists/${watchlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ symbol, name }),
    });
  },

  async removeTicker(watchlistId: string, symbol: string): Promise<Watchlist> {
    return fetchJson<Watchlist>(`/api/watchlists/${watchlistId}/items/${symbol}`, {
      method: 'DELETE',
    });
  },

  // Session
  async getSessionSnapshot(): Promise<{
    snapshot: SessionSnapshot;
    attentionDesk: MeaningfulChange[];
    allEvaluations: MeaningfulChange[];
    feedHealth: any;
  }> {
    return fetchJson('/api/session/snapshot');
  },

  async commitSnapshot(): Promise<SessionSnapshot> {
    return fetchJson<SessionSnapshot>('/api/session/snapshot', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async sendHeartbeat(): Promise<{ success: boolean; lastActiveAt: string }> {
    return fetchJson('/api/session/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async getSettings(): Promise<SensitivityConfig> {
    return fetchJson<SensitivityConfig>('/api/session/settings');
  },

  async updateSettings(config: Partial<SensitivityConfig>): Promise<SensitivityConfig> {
    return fetchJson<SensitivityConfig>('/api/session/settings', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  // Stock Deep Dive
  async getStockDeepDive(symbol: string): Promise<StockDeepDiveResponse> {
    return fetchJson<StockDeepDiveResponse>(`/api/stocks/${symbol}`);
  },

  // Chaos & Evaluator Tools
  async injectVolatility(
    symbol: string,
    deltaPercent: number,
    volumeMultiplier?: number,
    reason?: string
  ): Promise<any> {
    return fetchJson('/api/chaos/inject-volatility', {
      method: 'POST',
      body: JSON.stringify({ symbol, deltaPercent, volumeMultiplier, reason }),
    });
  },

  async simulateTimeTravel(minutesAgo: number, customLabel?: string): Promise<any> {
    return fetchJson('/api/chaos/time-travel', {
      method: 'POST',
      body: JSON.stringify({ minutesAgo, customLabel }),
    });
  },

  async simulateNetworkChaos(networkDrop: boolean, forceStale?: boolean): Promise<any> {
    return fetchJson('/api/chaos/network', {
      method: 'POST',
      body: JSON.stringify({ networkDrop, forceStale }),
    });
  },

  async resetChaos(): Promise<any> {
    return fetchJson('/api/chaos/reset', {
      method: 'POST',
    });
  },
};
