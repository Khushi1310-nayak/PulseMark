import { FastifyPluginAsync } from 'fastify';
import YahooFinance from 'yahoo-finance2';
import { mockStockService } from '../services/mock.service.js';
import { deltaService } from '../services/delta.service.js';
import { feedService, SYMBOL_TO_YAHOO } from '../services/feed.service.js';
import { store, DEFAULT_USER_ID } from '../lib/store.js';
import { evaluateStockAnomaly, StockHistoricalCandle, StockTick } from '@pulsemark/shared';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export const stocksRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/stocks
  fastify.get('/', async (request, reply) => {
    const ticks = feedService.getAllKnownTicks();
    return { success: true, data: ticks };
  });

  // GET /api/stocks/:symbol
  fastify.get<{ Params: { symbol: string } }>('/:symbol', async (request, reply) => {
    const symbol = request.params.symbol.toUpperCase();
    let tick: StockTick | undefined = feedService.getKnownTick(symbol);

    if (!tick) {
      tick = mockStockService.getTick(symbol);
    }

    if (!tick) {
      return reply.status(404).send({ success: false, error: `Stock ${symbol} not found` });
    }

    const snapshot = deltaService.getOrCreateSnapshot(DEFAULT_USER_ID);
    const benchmark = snapshot.prices[symbol] ?? null;
    const config = store.getSettings();

    const anomaly = evaluateStockAnomaly(tick, benchmark, config);
    const auditLogs = store.getAuditLogs(symbol);

    // Fetch real historical 5-minute candles from Yahoo Finance
    let history: StockHistoricalCandle[] = [];
    const yahooTicker = SYMBOL_TO_YAHOO[symbol] || `${symbol}.NS`;

    try {
      // Query intraday 5-minute candles for the past 24-48 hours
      const period1 = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const chartResult = await yf.chart(yahooTicker, { period1, interval: '5m' });

      if (chartResult && chartResult.quotes && chartResult.quotes.length > 0) {
        let cumulativeVolume = 0;
        let cumulativeValue = 0;

        history = chartResult.quotes
          .filter((q) => q.close !== null && q.close !== undefined)
          .slice(-40) // Keep last 40 intraday bars for clean UI
          .map((q, idx, arr) => {
            const open = Number((q.open ?? q.close ?? tick?.price ?? 0).toFixed(2));
            const high = Number((q.high ?? open).toFixed(2));
            const low = Number((q.low ?? open).toFixed(2));
            const close = Number((q.close ?? open).toFixed(2));
            const volume = q.volume ?? 0;

            cumulativeVolume += volume;
            cumulativeValue += close * (volume || 1);
            const vwap = Number((cumulativeValue / (cumulativeVolume || 1)).toFixed(2));

            // Mark anomaly point if price moved sharply on the latest candle
            const isLatest = idx === arr.length - 1;
            const isAnomalyPoint = isLatest && anomaly.requiresAttention;

            return {
              timestamp: q.date instanceof Date ? q.date.toISOString() : new Date(q.date).toISOString(),
              open,
              high,
              low,
              close,
              volume,
              vwap,
              isAnomalyPoint,
              anomalyReason: isAnomalyPoint ? anomaly.reasons[0]?.label : undefined,
            };
          });
      }
    } catch (err: any) {
      console.warn(`[StocksRoute] Live chart query for ${yahooTicker} failed, falling back to mock:`, err.message);
    }

    // Graceful fallback to mock candle history if live chart was unavailable
    if (history.length === 0) {
      history = mockStockService.getCandles(symbol);
    }

    const benchmarkPrice = benchmark?.price ?? tick.openPrice;
    const benchmarkVolume = benchmark?.volume ?? Math.floor(tick.avgVolume30d / 20);
    const benchmarkVWAP = benchmark?.vwap ?? tick.vwap;

    const priceDelta = Number((tick.price - benchmarkPrice).toFixed(2));
    const priceDeltaPercent = benchmarkPrice > 0 ? Number(((priceDelta / benchmarkPrice) * 100).toFixed(2)) : 0;
    const volumeDelta = tick.volume - benchmarkVolume;
    const vwapDelta = Number((tick.vwap - benchmarkVWAP).toFixed(2));

    const dayRangeExpanded = benchmark
      ? tick.dayHigh > benchmark.dayHigh || tick.dayLow < benchmark.dayLow
      : false;

    return {
      success: true,
      data: {
        symbol: tick.symbol,
        name: tick.name,
        current: tick,
        benchmark,
        benchmarkTime: snapshot.benchmarkTime,
        benchmarkLabel: snapshot.benchmarkLabel,
        delta: {
          priceDelta,
          priceDeltaPercent,
          volumeDelta,
          volumeRatio: tick.volumeRatio,
          vwapDelta,
          dayRangeExpanded,
        },
        anomaly,
        history,
        auditLogs,
      },
    };
  });
};
