import { StockTick, StockHistoricalCandle, AnomalyType } from '@pulsemark/shared';

interface StockDefinition {
  symbol: string;
  name: string;
  basePrice: number;
  avgVolume30d: number;
  week52High: number;
  week52Low: number;
  volatility: number;
}

const STOCK_DEFINITIONS: StockDefinition[] = [
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', basePrice: 984.50, avgVolume30d: 12500000, week52High: 1065.60, week52Low: 600.50, volatility: 0.008 },
  { symbol: 'INFY', name: 'Infosys Limited', basePrice: 1482.00, avgVolume30d: 6800000, week52High: 1720.00, week52Low: 1350.00, volatility: 0.006 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', basePrice: 4120.00, avgVolume30d: 2400000, week52High: 4500.00, week52Low: 3300.00, volatility: 0.004 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', basePrice: 2895.00, avgVolume30d: 7900000, week52High: 3217.00, week52Low: 2220.00, volatility: 0.005 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', basePrice: 1640.50, avgVolume30d: 18000000, week52High: 1757.00, week52Low: 1363.00, volatility: 0.005 },
  { symbol: 'ITC', name: 'ITC Limited', basePrice: 480.10, avgVolume30d: 11000000, week52High: 510.00, week52Low: 399.00, volatility: 0.003 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', basePrice: 1152.00, avgVolume30d: 14000000, week52High: 1257.00, week52Low: 898.00, volatility: 0.006 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', basePrice: 1345.00, avgVolume30d: 5500000, week52High: 1480.00, week52Low: 840.00, volatility: 0.005 },
  { symbol: 'SBIN', name: 'State Bank of India', basePrice: 822.40, avgVolume30d: 19000000, week52High: 912.00, week52Low: 555.00, volatility: 0.007 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', basePrice: 6850.00, avgVolume30d: 1500000, week52High: 8192.00, week52Low: 6187.00, volatility: 0.009 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', basePrice: 12420.00, avgVolume30d: 480000, week52High: 13400.00, week52Low: 9250.00, volatility: 0.006 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', basePrice: 2755.00, avgVolume30d: 3200000, week52High: 3010.00, week52Low: 1450.00, volatility: 0.008 },
  { symbol: 'LT', name: 'Larsen & Toubro', basePrice: 3560.00, avgVolume30d: 2100000, week52High: 3919.00, week52Low: 2860.00, volatility: 0.005 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', basePrice: 3415.00, avgVolume30d: 1100000, week52High: 3886.00, week52Low: 2882.00, volatility: 0.007 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma Industries', basePrice: 1585.00, avgVolume30d: 3900000, week52High: 1720.00, week52Low: 1080.00, volatility: 0.005 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', basePrice: 1780.00, avgVolume30d: 4200000, week52High: 1930.00, week52Low: 1540.00, volatility: 0.006 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', basePrice: 1195.00, avgVolume30d: 8500000, week52High: 1339.00, week52Low: 960.00, volatility: 0.006 },
  { symbol: 'WIPRO', name: 'Wipro Limited', basePrice: 492.50, avgVolume30d: 7100000, week52High: 545.00, week52Low: 375.00, volatility: 0.006 },
];

export class MockStockService {
  private currentTicks: Map<string, StockTick> = new Map();
  private historicalCandles: Map<string, StockHistoricalCandle[]> = new Map();
  private forcedAnomalies: Map<string, { deltaPct: number; volumeRatio: number; reason: string }> = new Map();

  constructor() {
    this.initializeAllStocks();
  }

  private initializeAllStocks(): void {
    const now = new Date();
    // Default session started at 09:15 AM today
    const marketOpen = new Date(now);
    marketOpen.setHours(9, 15, 0, 0);

    for (const def of STOCK_DEFINITIONS) {
      const openPrice = def.basePrice;
      const prevClose = Number((openPrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2));
      let currentPrice = openPrice;
      let dayHigh = openPrice;
      let dayLow = openPrice;
      let cumulativeVolume = 0;
      let cumulativeValue = 0;
      const sparkline: number[] = [];
      const candles: StockHistoricalCandle[] = [];

      // Generate intraday 5-minute candles from 9:15 AM to current time (or up to 40 candles)
      const totalPoints = 36; // 3 hours of 5-min intervals
      for (let i = 0; i < totalPoints; i++) {
        const pointTime = new Date(marketOpen.getTime() + i * 5 * 60 * 1000);
        const randomChange = (Math.random() - 0.49) * def.volatility * currentPrice;
        const candleOpen = currentPrice;
        const candleClose = Number((candleOpen + randomChange).toFixed(2));
        const candleHigh = Number((Math.max(candleOpen, candleClose) + Math.random() * 0.002 * candleOpen).toFixed(2));
        const candleLow = Number((Math.min(candleOpen, candleClose) - Math.random() * 0.002 * candleOpen).toFixed(2));
        const candleVolume = Math.floor((def.avgVolume30d / 75) * (0.6 + Math.random() * 0.8));

        currentPrice = candleClose;
        dayHigh = Math.max(dayHigh, candleHigh);
        dayLow = Math.min(dayLow, candleLow);
        cumulativeVolume += candleVolume;
        cumulativeValue += candleClose * candleVolume;
        const currentVWAP = Number((cumulativeValue / cumulativeVolume).toFixed(2));

        sparkline.push(currentPrice);
        candles.push({
          timestamp: pointTime.toISOString(),
          open: candleOpen,
          high: candleHigh,
          low: candleLow,
          close: candleClose,
          volume: candleVolume,
          vwap: currentVWAP,
          isAnomalyPoint: false,
        });
      }

      // Pre-seed some default anomalies on TATAMOTORS and INFY so Attention Desk has immediate rich data
      let initialVolumeRatio = 1.0;
      if (def.symbol === 'TATAMOTORS') {
        currentPrice = Number((openPrice * 1.034).toFixed(2)); // +3.4%
        dayHigh = Math.max(dayHigh, currentPrice);
        initialVolumeRatio = 3.2; // 3.2x volume
        sparkline[sparkline.length - 1] = currentPrice;
        const lastCandle = candles[candles.length - 1];
        if (lastCandle) {
          lastCandle.close = currentPrice;
          lastCandle.high = Math.max(lastCandle.high, currentPrice);
          lastCandle.isAnomalyPoint = true;
          lastCandle.anomalyReason = 'Aggressive Institutional Buying & Volume Spike';
        }
      } else if (def.symbol === 'INFY') {
        currentPrice = Number((openPrice * 0.979).toFixed(2)); // -2.1%
        dayLow = Math.min(dayLow, currentPrice);
        initialVolumeRatio = 2.4;
        sparkline[sparkline.length - 1] = currentPrice;
        const lastCandle = candles[candles.length - 1];
        if (lastCandle) {
          lastCandle.close = currentPrice;
          lastCandle.low = Math.min(lastCandle.low, currentPrice);
          lastCandle.isAnomalyPoint = true;
          lastCandle.anomalyReason = "Broke Day's Key Support Level";
        }
      } else if (def.symbol === 'RELIANCE') {
        initialVolumeRatio = 0.35; // Volume compression
      }

      const spread = Number((currentPrice * 0.0003).toFixed(2));
      const bidPrice = Number((currentPrice - spread / 2).toFixed(2));
      const askPrice = Number((currentPrice + spread / 2).toFixed(2));
      const change24h = Number((currentPrice - prevClose).toFixed(2));
      const change24hPercent = Number(((change24h / prevClose) * 100).toFixed(2));
      const vwap = Number((cumulativeValue / (cumulativeVolume || 1)).toFixed(2));

      const tick: StockTick = {
        symbol: def.symbol,
        name: def.name,
        price: currentPrice,
        change24h,
        change24hPercent,
        volume: cumulativeVolume,
        avgVolume30d: def.avgVolume30d,
        volumeRatio: initialVolumeRatio,
        dayHigh,
        dayLow,
        week52High: def.week52High,
        week52Low: def.week52Low,
        openPrice,
        prevClose,
        vwap,
        bidPrice,
        askPrice,
        spread,
        timestamp: new Date().toISOString(),
        sparkline,
        isStale: false,
      };

      this.currentTicks.set(def.symbol, tick);
      this.historicalCandles.set(def.symbol, candles);
    }
  }

  public getAllTicks(): StockTick[] {
    return Array.from(this.currentTicks.values());
  }

  public getTick(symbol: string): StockTick | undefined {
    return this.currentTicks.get(symbol.toUpperCase());
  }

  public getCandles(symbol: string): StockHistoricalCandle[] {
    return this.historicalCandles.get(symbol.toUpperCase()) ?? [];
  }

  public getSupportedStocks(): { symbol: string; name: string; price: number }[] {
    return Array.from(this.currentTicks.values()).map((t) => ({
      symbol: t.symbol,
      name: t.name,
      price: t.price,
    }));
  }

  /**
   * Generates a realistic micro-tick update across all or selected stocks.
   */
  public generateNextTickBatch(): StockTick[] {
    const updated: StockTick[] = [];
    const now = new Date().toISOString();

    for (const [symbol, tick] of this.currentTicks.entries()) {
      const def = STOCK_DEFINITIONS.find((d) => d.symbol === symbol);
      const volatility = def?.volatility ?? 0.005;

      // Normal micro-fluctuation (-0.15% to +0.15%)
      const priceDelta = (Math.random() - 0.49) * (tick.price * volatility * 0.1);
      const newPrice = Number((Math.max(1, tick.price + priceDelta)).toFixed(2));
      const newDayHigh = Math.max(tick.dayHigh, newPrice);
      const newDayLow = Math.min(tick.dayLow, newPrice);

      const addedVolume = Math.floor(Math.random() * 2500) + 100;
      const newVolume = tick.volume + addedVolume;
      const newChange24h = Number((newPrice - tick.prevClose).toFixed(2));
      const newChange24hPercent = Number(((newChange24h / tick.prevClose) * 100).toFixed(2));

      const spread = Number((newPrice * (0.0002 + Math.random() * 0.0002)).toFixed(2));
      const bidPrice = Number((newPrice - spread / 2).toFixed(2));
      const askPrice = Number((newPrice + spread / 2).toFixed(2));

      // Append to sparkline
      const sparkline = [...tick.sparkline.slice(-30), newPrice];

      const updatedTick: StockTick = {
        ...tick,
        price: newPrice,
        dayHigh: newDayHigh,
        dayLow: newDayLow,
        change24h: newChange24h,
        change24hPercent: newChange24hPercent,
        volume: newVolume,
        bidPrice,
        askPrice,
        spread,
        timestamp: now,
        sparkline,
      };

      this.currentTicks.set(symbol, updatedTick);
      updated.push(updatedTick);
    }

    return updated;
  }

  /**
   * Judge evaluator control: force sudden price shock / volume spike / support breach
   */
  public injectVolatility(
    symbol: string,
    deltaPercent: number,
    volumeMultiplier: number = 2.5,
    customReason?: string
  ): StockTick | null {
    const tick = this.currentTicks.get(symbol.toUpperCase());
    if (!tick) return null;

    const priceShift = (tick.price * deltaPercent) / 100;
    const newPrice = Number((tick.price + priceShift).toFixed(2));
    const newDayHigh = Math.max(tick.dayHigh, newPrice);
    const newDayLow = Math.min(tick.dayLow, newPrice);
    const newVolumeRatio = Number(volumeMultiplier.toFixed(1));
    const newVolume = Math.floor(tick.volume + (tick.avgVolume30d / 20) * volumeMultiplier);
    const newChange24h = Number((newPrice - tick.prevClose).toFixed(2));
    const newChange24hPercent = Number(((newChange24h / tick.prevClose) * 100).toFixed(2));

    const sparkline = [...tick.sparkline.slice(-25), newPrice];

    const updatedTick: StockTick = {
      ...tick,
      price: newPrice,
      dayHigh: newDayHigh,
      dayLow: newDayLow,
      change24h: newChange24h,
      change24hPercent: newChange24hPercent,
      volume: newVolume,
      volumeRatio: newVolumeRatio,
      timestamp: new Date().toISOString(),
      sparkline,
    };

    this.currentTicks.set(symbol.toUpperCase(), updatedTick);

    // Update candle history point
    const candles = this.historicalCandles.get(symbol.toUpperCase());
    if (candles && candles.length > 0) {
      candles.push({
        timestamp: new Date().toISOString(),
        open: tick.price,
        high: newDayHigh,
        low: newDayLow,
        close: newPrice,
        volume: newVolume - tick.volume,
        vwap: tick.vwap,
        isAnomalyPoint: true,
        anomalyReason: customReason ?? `Injected volatility: ${deltaPercent >= 0 ? '+' : ''}${deltaPercent}% shock`,
      });
    }

    return updatedTick;
  }
}

export const mockStockService = new MockStockService();
