import {
  SessionSnapshot,
  BenchmarkPricePoint,
  StockTick,
  evaluateMarketState,
  MeaningfulChange,
} from '@pulsemark/shared';
import { store, DEFAULT_USER_ID } from '../lib/store.js';
import { mockStockService } from './mock.service.js';
import { feedService } from './feed.service.js';

export class DeltaCalculationService {
  /**
   * Retrieves or initializes the active session snapshot for the user.
   */
  public getOrCreateSnapshot(userId: string = DEFAULT_USER_ID): SessionSnapshot {
    let snapshot = store.getSnapshot(userId);

    if (!snapshot) {
      snapshot = this.createDefaultMarketOpenSnapshot(userId);
      store.setSnapshot(userId, snapshot);
    }

    return snapshot;
  }

  /**
   * Sets up a default snapshot benchmarked to today at 09:15 AM (market open).
   */
  public createDefaultMarketOpenSnapshot(userId: string = DEFAULT_USER_ID): SessionSnapshot {
    const now = new Date();
    const marketOpen = new Date(now);
    marketOpen.setHours(9, 15, 0, 0);

    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const marketStatus = isWeekend ? 'WEEKEND' : 'OPEN';

    // Calculate time elapsed label
    const diffMs = Math.max(0, now.getTime() - marketOpen.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const label = isWeekend
      ? 'Market Closed • Benchmarked against Friday Close'
      : 'First session today — benchmarking against 09:15 AM Market Open';

    const allTicks = feedService.getAllKnownTicks();
    const prices: Record<string, BenchmarkPricePoint> = {};

    for (const tick of allTicks) {
      prices[tick.symbol] = {
        price: tick.openPrice,
        volume: Math.floor(tick.avgVolume30d / 20),
        timestamp: marketOpen.toISOString(),
        dayHigh: tick.openPrice,
        dayLow: tick.openPrice,
        vwap: tick.openPrice,
        spread: tick.spread,
      };
    }

    return {
      sessionId: `sess-${Date.now()}`,
      userId,
      benchmarkTime: marketOpen.toISOString(),
      benchmarkLabel: label,
      marketStatus,
      prices,
      lastActiveAt: now.toISOString(),
      isFirstSession: true,
    };
  }

  /**
   * Commits a new snapshot for the session (e.g. from tab blur or navigator.sendBeacon).
   */
  public commitSnapshot(userId: string, currentTicks: StockTick[]): SessionSnapshot {
    const now = new Date();
    const prices: Record<string, BenchmarkPricePoint> = {};

    for (const tick of currentTicks) {
      prices[tick.symbol] = {
        price: tick.price,
        volume: tick.volume,
        timestamp: now.toISOString(),
        dayHigh: tick.dayHigh,
        dayLow: tick.dayLow,
        vwap: tick.vwap,
        spread: tick.spread,
      };
    }

    const snapshot: SessionSnapshot = {
      sessionId: `sess-${Date.now()}`,
      userId,
      benchmarkTime: now.toISOString(),
      benchmarkLabel: `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Just now)`,
      marketStatus: 'OPEN',
      prices,
      lastActiveAt: now.toISOString(),
      isFirstSession: false,
    };

    store.setSnapshot(userId, snapshot);
    return snapshot;
  }

  /**
   * Edge Case Handling: Mid-Session Added Stocks
   * When a user adds a ticker mid-session, benchmark against the price at the time of addition
   * so that a 4-hour old baseline does not falsely trigger anomaly alerts.
   */
  public benchmarkStockOnAddition(
    userId: string = DEFAULT_USER_ID,
    symbol: string,
    currentPrice?: number
  ): void {
    const snapshot = this.getOrCreateSnapshot(userId);
    const upperSym = symbol.toUpperCase();
    const tick = feedService.getKnownTick(upperSym);
    const benchmarkPrice = currentPrice ?? tick?.price ?? 100;
    const now = new Date().toISOString();

    snapshot.prices[upperSym] = {
      price: benchmarkPrice,
      volume: tick?.volume ?? 1000,
      timestamp: now,
      dayHigh: tick?.dayHigh ?? benchmarkPrice,
      dayLow: tick?.dayLow ?? benchmarkPrice,
      vwap: tick?.vwap ?? benchmarkPrice,
      spread: tick?.spread ?? 0.1,
    };

    store.setSnapshot(userId, snapshot);
  }

  /**
   * Simulates Session Time Travel (Judge Evaluator Control)
   */
  public simulateTimeTravel(userId: string, minutesAgo: number, customLabel?: string): SessionSnapshot {
    const now = new Date();
    const travelTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
    const allTicks = mockStockService.getAllTicks();
    const prices: Record<string, BenchmarkPricePoint> = {};

    let label = customLabel;
    if (!label) {
      if (minutesAgo < 60) {
        label = `Today at ${travelTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${minutesAgo}m ago)`;
      } else if (minutesAgo < 1440) {
        const h = Math.floor(minutesAgo / 60);
        const m = minutesAgo % 60;
        label = `Today at ${travelTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${h}h ${m}m ago)`;
      } else {
        const days = Math.floor(minutesAgo / 1440);
        label = `${days} day${days > 1 ? 's' : ''} ago (${travelTime.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
      }
    }

    // Shift benchmark prices slightly based on simulated time travel
    for (const tick of allTicks) {
      const candles = mockStockService.getCandles(tick.symbol);
      let benchmarkPrice = tick.openPrice;
      let benchmarkVolume = Math.floor(tick.volume * 0.4);

      if (candles.length > 0) {
        const targetIndex = Math.max(0, candles.length - 1 - Math.min(candles.length - 1, Math.floor(minutesAgo / 5)));
        const candle = candles[targetIndex];
        if (candle) {
          benchmarkPrice = candle.open;
          benchmarkVolume = candle.volume * (targetIndex + 1);
        }
      }

      prices[tick.symbol] = {
        price: benchmarkPrice,
        volume: benchmarkVolume,
        timestamp: travelTime.toISOString(),
        dayHigh: Math.max(benchmarkPrice, tick.dayHigh * 0.99),
        dayLow: Math.min(benchmarkPrice, tick.dayLow * 1.01),
        vwap: benchmarkPrice,
        spread: tick.spread,
      };
    }

    const snapshot: SessionSnapshot = {
      sessionId: `sess-travel-${Date.now()}`,
      userId,
      benchmarkTime: travelTime.toISOString(),
      benchmarkLabel: label,
      marketStatus: 'OPEN',
      prices,
      lastActiveAt: now.toISOString(),
    };

    store.setSnapshot(userId, snapshot);
    return snapshot;
  }

  /**
   * Computes the complete evaluation for all stocks against the active snapshot.
   */
  public evaluateCurrentMarket(userId: string = DEFAULT_USER_ID): {
    snapshot: SessionSnapshot;
    allEvaluations: MeaningfulChange[];
    attentionDesk: MeaningfulChange[];
    normalTrading: MeaningfulChange[];
  } {
    const snapshot = this.getOrCreateSnapshot(userId);
    const ticks = feedService.getAllKnownTicks();
    const config = store.getSettings();

    const evaluation = evaluateMarketState(ticks, snapshot, config);

    // Save any newly detected high-severity anomalies to the audit log
    for (const item of evaluation.attentionDesk) {
      for (const reason of item.reasons) {
        if (reason.severity === 'critical' || reason.severity === 'high') {
          // Check if already logged recently
          const existingLogs = store.getAuditLogs(item.symbol);
          const alreadyLogged = existingLogs.some(
            (l) => l.title === reason.label && Date.now() - new Date(l.timestamp).getTime() < 300000
          );
          if (!alreadyLogged) {
            store.addAuditLog({
              symbol: item.symbol,
              triggerType: reason.type,
              title: reason.label,
              details: reason.description,
              deltaAtTrigger: item.priceDelta,
              priceAtTrigger: item.currentPrice,
              severity: reason.severity,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    return {
      snapshot,
      ...evaluation,
    };
  }
}

export const deltaService = new DeltaCalculationService();
