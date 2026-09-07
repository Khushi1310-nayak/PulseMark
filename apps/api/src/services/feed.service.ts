import YahooFinance from 'yahoo-finance2';
import { StockTick } from '@pulsemark/shared';
import { mockStockService } from './mock.service.js';
import { cacheGet, cacheSet } from '../lib/redis.js';

export type FeedSource = 'LIVE_FEED' | 'STALE_REDIS_CACHE' | 'SYNTHETIC_MOCK_FEED';

export interface FeedHealthStatus {
  source: FeedSource;
  isCircuitBreakerTripped: boolean;
  lastSuccessfulIngest: string;
  errorCount: number;
  simulatedNetworkDrop: boolean;
  latencyMs: number;
  provider: string;
}

// Map Indian NSE equity symbols to Yahoo Finance tickers (.NS)
export const SYMBOL_TO_YAHOO: Record<string, string> = {
  TATAMOTORS: 'TMCV.NS', // Tata Motors Ltd
  INFY: 'INFY.NS',       // Infosys Limited
  TCS: 'TCS.NS',         // Tata Consultancy Services
  RELIANCE: 'RELIANCE.NS',// Reliance Industries
  HDFCBANK: 'HDFCBANK.NS',// HDFC Bank Limited
  ITC: 'ITC.NS',         // ITC Limited
  ICICIBANK: 'ICICIBANK.NS',// ICICI Bank Ltd
  BHARTIARTL: 'BHARTIARTL.NS',// Bharti Airtel Ltd
  SBIN: 'SBIN.NS',       // State Bank of India
  BAJFINANCE: 'BAJFINANCE.NS',// Bajaj Finance Ltd
  MARUTI: 'MARUTI.NS',   // Maruti Suzuki India
  'M&M': 'M&M.NS',         // Mahindra & Mahindra
  LT: 'LT.NS',           // Larsen & Toubro
  TITAN: 'TITAN.NS',     // Titan Company Ltd
  SUNPHARMA: 'SUNPHARMA.NS',// Sun Pharma Industries
  KOTAKBANK: 'KOTAKBANK.NS',// Kotak Mahindra Bank
  AXISBANK: 'AXISBANK.NS',// Axis Bank Ltd
  WIPRO: 'WIPRO.NS',     // Wipro Limited
};

// Reverse lookup from Yahoo ticker to canonical symbol
const YAHOO_TO_SYMBOL: Record<string, string> = Object.entries(SYMBOL_TO_YAHOO).reduce(
  (acc, [sym, ySym]) => {
    acc[ySym] = sym;
    return acc;
  },
  {} as Record<string, string>
);

export class FeedIngestionService {
  private yf: InstanceType<typeof YahooFinance>;
  private status: FeedHealthStatus = {
    source: 'LIVE_FEED',
    isCircuitBreakerTripped: false,
    lastSuccessfulIngest: new Date().toISOString(),
    errorCount: 0,
    simulatedNetworkDrop: false,
    latencyMs: 14,
    provider: 'Yahoo Finance (NSE Live Feed)',
  };

  private listeners: Set<(ticks: StockTick[]) => void> = new Set();
  private tickInterval: NodeJS.Timeout | null = null;
  private sparklineCache: Map<string, number[]> = new Map();
  private lastKnownTicks: Map<string, StockTick> = new Map();
  private activeShocks: Map<string, { tick: StockTick; expiresAt: number }> = new Map();

  constructor() {
    this.yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    this.startStreamingLoop();
  }

  public getHealth(): FeedHealthStatus {
    return { ...this.status };
  }

  public setSimulatedChaos(networkDrop: boolean, forceStale: boolean): void {
    this.status.simulatedNetworkDrop = networkDrop;
    if (networkDrop || forceStale) {
      this.status.isCircuitBreakerTripped = true;
      this.status.source = forceStale ? 'STALE_REDIS_CACHE' : 'SYNTHETIC_MOCK_FEED';
      this.status.provider = forceStale ? 'Redis Stale Cache (Circuit Breaker)' : 'Synthetic Evaluator Mock';
    } else {
      this.status.isCircuitBreakerTripped = false;
      this.status.source = 'LIVE_FEED';
      this.status.provider = 'Yahoo Finance (NSE Live Feed)';
      this.status.errorCount = 0;
      this.activeShocks.clear();
    }
  }

  public injectShock(
    symbol: string,
    deltaPercent: number,
    volumeMultiplier: number = 2.5,
    customReason?: string
  ): StockTick | null {
    const canonicalSymbol = symbol.toUpperCase();
    const baseTick = this.lastKnownTicks.get(canonicalSymbol) || mockStockService.getTick(canonicalSymbol);
    if (!baseTick) return null;

    const priceShift = (baseTick.price * deltaPercent) / 100;
    const newPrice = Number((baseTick.price + priceShift).toFixed(2));
    const newDayHigh = Math.max(baseTick.dayHigh, newPrice);
    const newDayLow = Math.min(baseTick.dayLow, newPrice);
    const newVolumeRatio = Number(volumeMultiplier.toFixed(1));
    const newVolume = Math.floor(baseTick.volume + (baseTick.avgVolume30d / 20) * volumeMultiplier);
    const newChange24h = Number((newPrice - baseTick.prevClose).toFixed(2));
    const newChange24hPercent = Number(((newChange24h / baseTick.prevClose) * 100).toFixed(2));

    const existingSparkline = this.sparklineCache.get(canonicalSymbol) || baseTick.sparkline;
    const updatedSparkline = [...existingSparkline.slice(-29), newPrice];
    this.sparklineCache.set(canonicalSymbol, updatedSparkline);

    const shockedTick: StockTick = {
      ...baseTick,
      price: newPrice,
      dayHigh: newDayHigh,
      dayLow: newDayLow,
      change24h: newChange24h,
      change24hPercent: newChange24hPercent,
      volume: newVolume,
      volumeRatio: newVolumeRatio,
      sparkline: updatedSparkline,
      timestamp: new Date().toISOString(),
    };

    this.activeShocks.set(canonicalSymbol, {
      tick: shockedTick,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    this.lastKnownTicks.set(canonicalSymbol, shockedTick);

    // Keep mock service in sync
    mockStockService.injectVolatility(canonicalSymbol, deltaPercent, volumeMultiplier, customReason);

    // Broadcast immediately to all connected clients
    const allTicks = this.getAllKnownTicks();
    this.listeners.forEach((listener) => listener(allTicks));

    return shockedTick;
  }

  public clearShocks(): void {
    this.activeShocks.clear();
  }

  public subscribe(callback: (ticks: StockTick[]) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Genuine live market data fetch from Yahoo Finance (NSE)
   */
  public async fetchLiveQuotesFromExchange(): Promise<StockTick[]> {
    const startTime = Date.now();
    const yahooTickers = Object.values(SYMBOL_TO_YAHOO);

    const quotes = await this.yf.quote(yahooTickers);
    if (!quotes || quotes.length === 0) {
      throw new Error('Empty quote response received from Yahoo Finance');
    }

    const ticks: StockTick[] = [];
    const now = new Date().toISOString();

    for (const q of quotes) {
      if (!q.symbol) continue;
      const canonicalSymbol = YAHOO_TO_SYMBOL[q.symbol] || q.symbol.replace('.NS', '');

      // If there's an active simulated shock for this symbol, preserve the shock tick
      const shock = this.activeShocks.get(canonicalSymbol);
      if (shock && Date.now() < shock.expiresAt) {
        ticks.push(shock.tick);
        this.lastKnownTicks.set(canonicalSymbol, shock.tick);
        continue;
      }

      const price = Number((q.regularMarketPrice ?? 0).toFixed(2));
      const prevClose = Number((q.regularMarketPreviousClose ?? price).toFixed(2));
      const openPrice = Number((q.regularMarketOpen ?? prevClose).toFixed(2));
      const change24h = Number((q.regularMarketChange ?? (price - prevClose)).toFixed(2));
      const change24hPercent = Number((q.regularMarketChangePercent ?? 0).toFixed(2));
      const volume = q.regularMarketVolume ?? 0;
      const avgVolume30d = q.averageDailyVolume3Month ?? 10000000;
      const volumeRatio = Number((avgVolume30d > 0 ? volume / avgVolume30d : 1.0).toFixed(1));
      const dayHigh = Number((q.regularMarketDayHigh ?? price).toFixed(2));
      const dayLow = Number((q.regularMarketDayLow ?? price).toFixed(2));
      const week52High = Number((q.fiftyTwoWeekHigh ?? price).toFixed(2));
      const week52Low = Number((q.fiftyTwoWeekLow ?? price).toFixed(2));
      const bidPrice = Number((q.bid ?? price).toFixed(2));
      const askPrice = Number((q.ask ?? price).toFixed(2));
      const spread = Number(Math.max(0.05, askPrice - bidPrice).toFixed(2));
      const vwap = Number((price * 0.998).toFixed(2)); // Approx intraday VWAP baseline

      // Maintain dynamic sparkline
      const existingSparkline = this.sparklineCache.get(canonicalSymbol) || [prevClose, openPrice];
      const updatedSparkline = [...existingSparkline.slice(-29), price];
      this.sparklineCache.set(canonicalSymbol, updatedSparkline);

      const tick: StockTick = {
        symbol: canonicalSymbol,
        name: q.shortName || q.longName || canonicalSymbol,
        price,
        change24h,
        change24hPercent,
        volume,
        avgVolume30d,
        volumeRatio,
        dayHigh,
        dayLow,
        week52High,
        week52Low,
        openPrice,
        prevClose,
        vwap,
        bidPrice,
        askPrice,
        spread,
        timestamp: now,
        sparkline: updatedSparkline,
        isStale: false,
      };

      this.lastKnownTicks.set(canonicalSymbol, tick);
      ticks.push(tick);
    }

    this.status.latencyMs = Date.now() - startTime;
    return ticks;
  }

  /**
   * Main 3-Tier Circuit Breaker Ingest:
   * 1. Primary: Live Yahoo Finance fetch
   * 2. Fallback: Redis stale cache (`isStale: true`)
   * 3. Tertiary: In-memory fallback (`mockStockService`) if external API throws or rate-limits
   */
  public async getLatestTicks(): Promise<{ ticks: StockTick[]; source: FeedSource }> {
    // 1. Check if simulated network drop is active (Scenario Simulator Mode)
    if (this.status.simulatedNetworkDrop) {
      this.status.source = 'STALE_REDIS_CACHE';
      this.status.provider = 'Redis Stale Cache (Circuit Breaker Active)';
      const cached = await this.readStaleCache();
      if (cached && cached.length > 0) {
        return { ticks: cached.map((t) => ({ ...t, isStale: true })), source: 'STALE_REDIS_CACHE' };
      }
      return {
        ticks: mockStockService.getAllTicks().map((t) => ({ ...t, isStale: true })),
        source: 'SYNTHETIC_MOCK_FEED',
      };
    }

    // 2. Primary Tier: Live Exchange Ingest
    try {
      const ticks = await this.fetchLiveQuotesFromExchange();
      this.status.lastSuccessfulIngest = new Date().toISOString();
      this.status.source = 'LIVE_FEED';
      this.status.provider = 'Yahoo Finance (NSE Live Feed)';
      this.status.errorCount = 0;
      this.status.isCircuitBreakerTripped = false;

      // Update Redis/In-memory cache asynchronously
      await this.saveToCache(ticks);

      return { ticks, source: 'LIVE_FEED' };
    } catch (err: any) {
      console.warn('[FeedService] Live feed error, activating 3-tier circuit breaker:', err.message);
      this.status.errorCount += 1;
      this.status.isCircuitBreakerTripped = true;

      // 3. Secondary Tier: Stale Cache Fallback
      const cached = await this.readStaleCache();
      if (cached && cached.length > 0) {
        this.status.source = 'STALE_REDIS_CACHE';
        this.status.provider = 'Redis Stale Cache (Fallback)';
        return { ticks: cached.map((t) => ({ ...t, isStale: true })), source: 'STALE_REDIS_CACHE' };
      }

      // If we have previously fetched live ticks in memory, serve them as stale
      if (this.lastKnownTicks.size > 0) {
        this.status.source = 'STALE_REDIS_CACHE';
        this.status.provider = 'In-Memory Stale Snapshot (Fallback)';
        return {
          ticks: Array.from(this.lastKnownTicks.values()).map((t) => ({ ...t, isStale: true })),
          source: 'STALE_REDIS_CACHE',
        };
      }

      // 4. Tertiary Tier: Synthetic Mock Fallback
      this.status.source = 'SYNTHETIC_MOCK_FEED';
      this.status.provider = 'Synthetic Mock Evaluator (Fallback)';
      return { ticks: mockStockService.getAllTicks(), source: 'SYNTHETIC_MOCK_FEED' };
    }
  }

  public getKnownTick(symbol: string): StockTick | undefined {
    return this.lastKnownTicks.get(symbol.toUpperCase()) || mockStockService.getTick(symbol);
  }

  public getAllKnownTicks(): StockTick[] {
    if (this.lastKnownTicks.size > 0) {
      return Array.from(this.lastKnownTicks.values());
    }
    return mockStockService.getAllTicks();
  }

  private async saveToCache(ticks: StockTick[]): Promise<void> {
    try {
      await cacheSet('pulsemark:ticks:latest', JSON.stringify(ticks), 60);
    } catch {
      // Silent cache error
    }
  }

  private async readStaleCache(): Promise<StockTick[] | null> {
    try {
      const data = await cacheGet('pulsemark:ticks:latest');
      if (data) {
        return JSON.parse(data) as StockTick[];
      }
    } catch {
      // ignore
    }
    return null;
  }

  private startStreamingLoop(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);

    // Initial fetch
    this.getLatestTicks().catch(() => {});

    // Broadcast updates every 2.5 seconds to connected SSE clients
    this.tickInterval = setInterval(async () => {
      const result = await this.getLatestTicks();
      for (const listener of this.listeners) {
        try {
          listener(result.ticks);
        } catch (err) {
          console.error('[FeedService] Error notifying listener:', err);
        }
      }
    }, 2500);
  }
}

export const feedService = new FeedIngestionService();
