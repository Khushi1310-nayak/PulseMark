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
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', basePrice: 458.20, avgVolume30d: 12500000, week52High: 469.20, week52Low: 380.50, volatility: 0.008 },
  { symbol: 'INFY', name: 'Infosys Limited', basePrice: 1130.00, avgVolume30d: 6800000, week52High: 1250.00, week52Low: 980.00, volatility: 0.006 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', basePrice: 2820.00, avgVolume30d: 2400000, week52High: 3200.00, week52Low: 2400.00, volatility: 0.004 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', basePrice: 1322.00, avgVolume30d: 7900000, week52High: 1600.00, week52Low: 1100.00, volatility: 0.005 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', basePrice: 712.10, avgVolume30d: 18000000, week52High: 850.00, week52Low: 620.00, volatility: 0.005 },
  { symbol: 'ITC', name: 'ITC Limited', basePrice: 264.10, avgVolume30d: 11000000, week52High: 310.00, week52Low: 220.00, volatility: 0.003 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', basePrice: 1423.20, avgVolume30d: 14000000, week52High: 1550.00, week52Low: 1150.00, volatility: 0.006 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', basePrice: 1840.00, avgVolume30d: 5500000, week52High: 1950.00, week52Low: 1350.00, volatility: 0.005 },
  { symbol: 'SBIN', name: 'State Bank of India', basePrice: 1016.10, avgVolume30d: 19000000, week52High: 1120.00, week52Low: 750.00, volatility: 0.007 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', basePrice: 1060.50, avgVolume30d: 1500000, week52High: 1250.00, week52Low: 850.00, volatility: 0.009 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', basePrice: 12420.00, avgVolume30d: 480000, week52High: 13400.00, week52Low: 9250.00, volatility: 0.006 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', basePrice: 2755.00, avgVolume30d: 3200000, week52High: 3010.00, week52Low: 1450.00, volatility: 0.008 },
  { symbol: 'LT', name: 'Larsen & Toubro', basePrice: 3560.00, avgVolume30d: 2100000, week52High: 3919.00, week52Low: 2860.00, volatility: 0.005 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', basePrice: 5020.00, avgVolume30d: 1100000, week52High: 5400.00, week52Low: 3200.00, volatility: 0.007 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma Industries', basePrice: 1585.00, avgVolume30d: 3900000, week52High: 1720.00, week52Low: 1080.00, volatility: 0.005 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', basePrice: 424.50, avgVolume30d: 4200000, week52High: 550.00, week52Low: 350.00, volatility: 0.006 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', basePrice: 1195.00, avgVolume30d: 8500000, week52High: 1339.00, week52Low: 960.00, volatility: 0.006 },
  { symbol: 'WIPRO', name: 'Wipro Limited', basePrice: 176.40, avgVolume30d: 7100000, week52High: 220.00, week52Low: 130.00, volatility: 0.006 },
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
      const prevClose = Number((openPrice * 0.996).toFixed(2));
      let currentPrice = openPrice;
      let dayHigh = openPrice;
      let dayLow = openPrice;
      const sparkline: number[] = [prevClose, openPrice];
      const candles: StockHistoricalCandle[] = [];

      let runningVolume = 0;
      let runningValue = 0;

      // Generate 40 historical 5-minute intervals starting from 09:15 AM
      for (let i = 0; i < 40; i++) {
        const pointTime = new Date(marketOpen.getTime() + i * 5 * 60 * 1000);
        // Realistic subtle Brownian motion
        const stepPct = (Math.random() - 0.495) * def.volatility;
        const candleOpen = currentPrice;
        currentPrice = Number(Math.max(def.week52Low * 0.95, currentPrice * (1 + stepPct)).toFixed(2));
        const candleHigh = Number(Math.max(candleOpen, currentPrice, currentPrice * (1 + Math.random() * 0.002)).toFixed(2));
        const candleLow = Number(Math.min(candleOpen, currentPrice, currentPrice * (1 - Math.random() * 0.002)).toFixed(2));
        const candleClose = currentPrice;

        dayHigh = Math.max(dayHigh, candleHigh);
        dayLow = Math.min(dayLow, candleLow);

        const candleVolume = Math.floor(Math.random() * (def.avgVolume30d / 75)) + 5000;
        runningVolume += candleVolume;
        runningValue += candleClose * candleVolume;
        const currentVWAP = Number((runningValue / runningVolume).toFixed(2));

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

      // Pre-seed realistic anomalies on TATAMOTORS and INFY
      let initialVolumeRatio = 1.0;
      if (def.symbol === 'TATAMOTORS') {
        currentPrice = Number((openPrice * 1.008).toFixed(2));
        dayHigh = Math.max(dayHigh, currentPrice);
        initialVolumeRatio = 2.1;
        sparkline[sparkline.length - 1] = currentPrice;
        const lastCandle = candles[candles.length - 1];
        if (lastCandle) {
          lastCandle.close = currentPrice;
          lastCandle.high = Math.max(lastCandle.high, currentPrice);
          lastCandle.isAnomalyPoint = true;
          lastCandle.anomalyReason = 'Institutional Volume Spike & Trend Continuation';
        }
      } else if (def.symbol === 'INFY') {
        currentPrice = Number((openPrice * 0.992).toFixed(2));
        dayLow = Math.min(dayLow, currentPrice);
        initialVolumeRatio = 1.8;
        sparkline[sparkline.length - 1] = currentPrice;
        const lastCandle = candles[candles.length - 1];
        if (lastCandle) {
          lastCandle.close = currentPrice;
          lastCandle.low = Math.min(lastCandle.low, currentPrice);
          lastCandle.isAnomalyPoint = true;
          lastCandle.anomalyReason = "Support Test Near Session Low";
        }
      } else if (def.symbol === 'RELIANCE') {
        initialVolumeRatio = 0.45; // Volume compression
      }

      const spread = Number((currentPrice * 0.0003).toFixed(2));
      const bidPrice = Number((currentPrice - spread / 2).toFixed(2));
      const askPrice = Number((currentPrice + spread / 2).toFixed(2));
      const change24h = Number((currentPrice - prevClose).toFixed(2));
      const change24hPercent = Number(((change24h / prevClose) * 100).toFixed(2));
      const vwap = Number((runningValue / (runningVolume || 1)).toFixed(2));

      const tick: StockTick = {
        symbol: def.symbol,
        name: def.name,
        price: currentPrice,
        change24h,
        change24hPercent,
        volume: runningVolume,
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
   * Scenario simulation control: force sudden price shock / volume spike / support breach
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
