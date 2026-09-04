/**
 * Real-time equity market tick received from upstream ingestion pipeline
 * (Yahoo Finance NSE feed -> In-memory sliding window -> SSE distributor).
 */
export interface StockTick {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume: number;
  avgVolume30d: number;
  volumeRatio: number; // e.g. 3.2 (3.2x of 30d avg)
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  openPrice: number;
  prevClose: number;
  vwap: number;
  bidPrice: number;
  askPrice: number;
  spread: number;
  timestamp: string; // ISO 8601
  sparkline: number[];
  isStale?: boolean;
}

export interface BenchmarkPricePoint {
  price: number;
  volume: number;
  timestamp: string;
  dayHigh: number;
  dayLow: number;
  vwap: number;
  spread?: number;
}

/**
 * User's temporal portfolio baseline (T0) captured at logout, tab-blur, or day market open.
 * Acts as the baseline anchor against which all return-session deltas (T1) are evaluated.
 */
export interface SessionSnapshot {
  sessionId: string;
  userId: string;
  benchmarkTime: string; // ISO 8601 (T0)
  benchmarkLabel: string; // e.g., "Today at 09:15 AM (2h 14m ago)"
  marketStatus: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'WEEKEND';
  prices: Record<string, BenchmarkPricePoint>;
  lastActiveAt: string;
  isFirstSession?: boolean; // True when benchmarking against Day Market Open (09:15 AM)
}

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'info';

export type AnomalyType =
  | 'PRICE_SURGE'
  | 'PRICE_DROP'
  | 'VOLUME_SPIKE'
  | 'SUPPORT_BREAK'
  | 'RESISTANCE_BREAKOUT'
  | 'SPREAD_COMPRESSION'
  | 'SPREAD_WIDENING'
  | 'VWAP_DIVERGENCE'
  | 'PRICE_GAP';

export interface AnomalyReason {
  type: AnomalyType;
  label: string; // e.g. "Volume: 3.2x normal", "Broke Day's Support", "Delta: +₹32 since logout"
  description: string;
  severity: AnomalySeverity;
  metricValue?: string | number;
}

/**
 * Multi-factor anomaly evaluation output comparing current market tick against T0 snapshot.
 * Powers the Attention Desk (high conviction anomalies) and Watchlist Matrix (normal trading).
 */
export interface MeaningfulChange {
  symbol: string;
  name: string;
  currentPrice: number;
  benchmarkPrice: number;
  priceDelta: number; // Current - Benchmark
  priceDeltaPercent: number; // ((Current - Benchmark) / Benchmark) * 100
  dayChangePercent: number;
  volume: number;
  volumeRatio: number;
  vwap: number;
  dayHigh: number;
  dayLow: number;
  reasons: AnomalyReason[];
  anomalyScore: number; // 0 to 100 composite index
  requiresAttention: boolean;
  detectedAt: string;
  sparkline: number[];
  isStale?: boolean;
}

export interface SensitivityConfig {
  priceShiftThresholdPercent: number; // default: 1.5%
  volumeAnomalyMultiplier: number; // default: 2.0x
  rangeBreachDetection: boolean; // default: true
  vwapDivergenceThresholdPercent: number; // default: 1.2%
  minAnomalyScoreForAttention: number; // default: 35
}

export const DEFAULT_SENSITIVITY_CONFIG: SensitivityConfig = {
  priceShiftThresholdPercent: 1.5,
  volumeAnomalyMultiplier: 2.0,
  rangeBreachDetection: true,
  vwapDivergenceThresholdPercent: 1.2,
  minAnomalyScoreForAttention: 35,
};

export interface WatchlistItem {
  symbol: string;
  name: string;
  orderIndex: number;
  addedAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  symbol: string;
  timestamp: string;
  triggerType: AnomalyType;
  title: string;
  details: string;
  deltaAtTrigger: number;
  priceAtTrigger: number;
  severity: AnomalySeverity;
}

export interface StockHistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  isAnomalyPoint?: boolean;
  anomalyReason?: string;
}

export interface StockDeepDiveResponse {
  symbol: string;
  name: string;
  current: StockTick;
  benchmark: BenchmarkPricePoint | null;
  benchmarkTime: string;
  benchmarkLabel: string;
  delta: {
    priceDelta: number;
    priceDeltaPercent: number;
    volumeDelta: number;
    volumeRatio: number;
    vwapDelta: number;
    dayRangeExpanded: boolean;
  };
  anomaly: MeaningfulChange;
  history: StockHistoricalCandle[];
  auditLogs: AuditLogEntry[];
}

export interface TimeTravelPreset {
  id: string;
  label: string;
  durationMinutes: number;
  description: string;
}

export interface MarketStreamEvent {
  type: 'TICK_UPDATE' | 'ANOMALY_TRIGGER' | 'HEARTBEAT' | 'STATUS_CHANGE';
  timestamp: string;
  payload: any;
}
