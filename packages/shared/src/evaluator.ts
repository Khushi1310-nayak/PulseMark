import {
  StockTick,
  BenchmarkPricePoint,
  SensitivityConfig,
  MeaningfulChange,
  AnomalyReason,
  SessionSnapshot,
  DEFAULT_SENSITIVITY_CONFIG,
} from './types.js';

/**
 * Pure evaluator logic for PulseMark: calculates multi-dimensional deltas
 * against a user's prior session snapshot (T0) and generates actionable anomaly scores and rationale chips.
 *
 * Mathematical Formulation:
 *   Score = min(100, ∑ w_i · φ_i)
 *   - φ_price: Temporal price shift vs. T0 baseline (|ΔP| ≥ 1.5% -> 30pts, ≥ 3.0% -> 45pts)
 *   - φ_vol:   Volume surge multiplier vs. 30d baseline (V_ratio ≥ 2.0x -> 25pts, ≥ 3.0x -> 35pts)
 *   - φ_range: Structural breakout above T0 high (25pts) or support breakdown below T0 low (30pts)
 *   - φ_vwap:  Intraday mean-reversion extension (|ΔVWAP| ≥ 1.8% -> 15pts)
 *   - φ_spread: Order-book liquidity shifts (narrowing -> 5pts, widening -> 10pts)
 *
 * Promotion Criterion:
 *   requiresAttention = Score >= minAnomalyScoreForAttention || any(severity == 'critical')
 */
export function evaluateStockAnomaly(
  tick: StockTick,
  benchmark?: BenchmarkPricePoint | null,
  config: SensitivityConfig = DEFAULT_SENSITIVITY_CONFIG
): MeaningfulChange {
  const reasons: AnomalyReason[] = [];
  let anomalyScore = 0;

  // Fallback anchor: If no prior snapshot exists (T0 = null), benchmark against open price or prev close
  const benchmarkPrice = benchmark?.price ?? (tick.openPrice > 0 ? tick.openPrice : tick.prevClose);
  const benchmarkVolume = benchmark?.volume ?? (tick.avgVolume30d / 6.5); // approx hourly baseline
  const benchmarkVWAP = benchmark?.vwap ?? tick.vwap;

  const priceDelta = Number((tick.price - benchmarkPrice).toFixed(2));
  const priceDeltaPercent = benchmarkPrice > 0
    ? Number((((tick.price - benchmarkPrice) / benchmarkPrice) * 100).toFixed(2))
    : 0;

  const priceDeltaSign = priceDelta >= 0 ? '+' : '';
  const priceDeltaFormatted = `${priceDeltaSign}₹${Math.abs(priceDelta).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // 1. Price Shift & Shock Detection
  const absDeltaPercent = Math.abs(priceDeltaPercent);
  if (absDeltaPercent >= config.priceShiftThresholdPercent * 2) {
    const isUp = priceDeltaPercent > 0;
    reasons.push({
      type: isUp ? 'PRICE_SURGE' : 'PRICE_DROP',
      label: `Delta: ${priceDeltaFormatted} (${priceDeltaSign}${priceDeltaPercent}%) since logout`,
      description: `Sharp price ${isUp ? 'surge' : 'plunge'} of ${Math.abs(priceDeltaPercent)}% compared to your last session baseline.`,
      severity: 'critical',
      metricValue: `${priceDeltaSign}${priceDeltaPercent}%`,
    });
    anomalyScore += 45;
  } else if (absDeltaPercent >= config.priceShiftThresholdPercent) {
    const isUp = priceDeltaPercent > 0;
    reasons.push({
      type: isUp ? 'PRICE_SURGE' : 'PRICE_DROP',
      label: `Delta: ${priceDeltaFormatted} since logout`,
      description: `Price moved ${priceDeltaSign}${priceDeltaPercent}% since your last session snapshot.`,
      severity: 'high',
      metricValue: `${priceDeltaSign}${priceDeltaPercent}%`,
    });
    anomalyScore += 30;
  }

  // 2. Volume Spike & Compression Detection
  if (tick.volumeRatio >= config.volumeAnomalyMultiplier * 1.5) {
    reasons.push({
      type: 'VOLUME_SPIKE',
      label: `Volume: ${tick.volumeRatio.toFixed(1)}x normal`,
      description: `Aggressive buying/selling pressure with volume ${tick.volumeRatio.toFixed(1)}x above the 30-day trailing baseline.`,
      severity: 'critical',
      metricValue: `${tick.volumeRatio.toFixed(1)}x`,
    });
    anomalyScore += 35;
  } else if (tick.volumeRatio >= config.volumeAnomalyMultiplier) {
    reasons.push({
      type: 'VOLUME_SPIKE',
      label: `Volume: ${tick.volumeRatio.toFixed(1)}x normal`,
      description: `Significant volume expansion detected (${tick.volumeRatio.toFixed(1)}x average).`,
      severity: 'high',
      metricValue: `${tick.volumeRatio.toFixed(1)}x`,
    });
    anomalyScore += 25;
  } else if (tick.volumeRatio < 0.4 && tick.volume > 0) {
    reasons.push({
      type: 'SPREAD_COMPRESSION',
      label: 'Volume Compression',
      description: 'Volume drying up severely, indicating impending volatility breakout.',
      severity: 'info',
      metricValue: `${tick.volumeRatio.toFixed(1)}x`,
    });
    anomalyScore += 10;
  }

  // 3. Range Breaches (Support breakdown or Resistance breakout)
  if (config.rangeBreachDetection) {
    // Check Day High/Low breaches compared to benchmark
    if (benchmark && tick.price > benchmark.dayHigh && benchmark.dayHigh > 0) {
      reasons.push({
        type: 'RESISTANCE_BREAKOUT',
        label: "Broke Day's Resistance",
        description: `Price pierced above the previous session high of ₹${benchmark.dayHigh.toFixed(2)}.`,
        severity: 'high',
        metricValue: `High: ₹${tick.dayHigh.toFixed(2)}`,
      });
      anomalyScore += 25;
    } else if (benchmark && tick.price < benchmark.dayLow && benchmark.dayLow > 0) {
      reasons.push({
        type: 'SUPPORT_BREAK',
        label: "Broke Day's Support",
        description: `Price cracked below the previous session low of ₹${benchmark.dayLow.toFixed(2)}.`,
        severity: 'critical',
        metricValue: `Low: ₹${tick.dayLow.toFixed(2)}`,
      });
      anomalyScore += 30;
    }

    // 52-Week Extreme checks
    if (tick.price >= tick.week52High * 0.995) {
      reasons.push({
        type: 'RESISTANCE_BREAKOUT',
        label: 'Near 52W High',
        description: `Trading within 0.5% of 52-week peak (₹${tick.week52High.toFixed(2)}).`,
        severity: 'medium',
        metricValue: `52W High: ₹${tick.week52High.toFixed(2)}`,
      });
      anomalyScore += 15;
    } else if (tick.price <= tick.week52Low * 1.005) {
      reasons.push({
        type: 'SUPPORT_BREAK',
        label: 'Near 52W Low',
        description: `Trading within 0.5% of 52-week low (₹${tick.week52Low.toFixed(2)}).`,
        severity: 'high',
        metricValue: `52W Low: ₹${tick.week52Low.toFixed(2)}`,
      });
      anomalyScore += 20;
    }
  }

  // 4. VWAP Divergence
  if (tick.vwap > 0) {
    const vwapDiffPercent = ((tick.price - tick.vwap) / tick.vwap) * 100;
    if (Math.abs(vwapDiffPercent) >= config.vwapDivergenceThresholdPercent * 1.5) {
      const isAbove = vwapDiffPercent > 0;
      reasons.push({
        type: 'VWAP_DIVERGENCE',
        label: `VWAP Divergence (${isAbove ? '+' : ''}${vwapDiffPercent.toFixed(1)}%)`,
        description: `Price has extended ${Math.abs(vwapDiffPercent).toFixed(1)}% ${isAbove ? 'above' : 'below'} the intraday VWAP of ₹${tick.vwap.toFixed(2)}.`,
        severity: 'medium',
        metricValue: `VWAP: ₹${tick.vwap.toFixed(2)}`,
      });
      anomalyScore += 15;
    }
  }

  // 5. Bid/Ask Spread Dynamics
  if (tick.spread > 0 && tick.price > 0) {
    const spreadBps = (tick.spread / tick.price) * 10000;
    if (spreadBps < 4) {
      reasons.push({
        type: 'SPREAD_COMPRESSION',
        label: 'Spread narrowing',
        description: 'Tight bid-ask spread indicates surging institutional order matching.',
        severity: 'info',
        metricValue: `${spreadBps.toFixed(1)} bps`,
      });
      anomalyScore += 5;
    } else if (spreadBps > 30) {
      reasons.push({
        type: 'SPREAD_WIDENING',
        label: 'Spread Widening',
        description: 'Order book thinning out; elevated slippage risk.',
        severity: 'medium',
        metricValue: `${spreadBps.toFixed(1)} bps`,
      });
      anomalyScore += 10;
    }
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, anomalyScore));
  const requiresAttention = finalScore >= config.minAnomalyScoreForAttention || reasons.some(r => r.severity === 'critical');

  return {
    symbol: tick.symbol,
    name: tick.name,
    currentPrice: tick.price,
    benchmarkPrice,
    priceDelta,
    priceDeltaPercent,
    dayChangePercent: tick.change24hPercent,
    volume: tick.volume,
    volumeRatio: tick.volumeRatio,
    vwap: tick.vwap,
    dayHigh: tick.dayHigh,
    dayLow: tick.dayLow,
    reasons,
    anomalyScore: finalScore,
    requiresAttention,
    detectedAt: tick.timestamp,
    sparkline: tick.sparkline,
    isStale: tick.isStale,
  };
}

/**
 * Batch evaluates a list of stocks against a session snapshot.
 * Returns both the full list and the sorted 'Attention Desk' anomaly list.
 */
export function evaluateMarketState(
  ticks: StockTick[],
  snapshot?: SessionSnapshot | null,
  config: SensitivityConfig = DEFAULT_SENSITIVITY_CONFIG
): {
  allEvaluations: MeaningfulChange[];
  attentionDesk: MeaningfulChange[];
  normalTrading: MeaningfulChange[];
} {
  const allEvaluations = ticks.map((tick) => {
    const benchmark = snapshot?.prices[tick.symbol] ?? null;
    return evaluateStockAnomaly(tick, benchmark, config);
  });

  // Attention desk sorted by anomalyScore descending
  const attentionDesk = allEvaluations
    .filter((item) => item.requiresAttention)
    .sort((a, b) => b.anomalyScore - a.anomalyScore);

  const normalTrading = allEvaluations.filter((item) => !item.requiresAttention);

  return {
    allEvaluations,
    attentionDesk,
    normalTrading,
  };
}
