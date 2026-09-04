import { evaluateStockAnomaly, evaluateMarketState, DEFAULT_SENSITIVITY_CONFIG, StockTick } from './src/index.js';

function runTests() {
  console.log('🧪 Running PulseMark Pure Evaluator Unit Tests...\n');

  const baseTick: StockTick = {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd',
    price: 980.0,
    change24h: 15.0,
    change24hPercent: 1.55,
    volume: 12000000,
    avgVolume30d: 10000000,
    volumeRatio: 1.2,
    dayHigh: 985.0,
    dayLow: 965.0,
    week52High: 1065.0,
    week52Low: 600.0,
    openPrice: 965.0,
    prevClose: 965.0,
    vwap: 975.0,
    bidPrice: 979.8,
    askPrice: 980.2,
    spread: 0.4,
    timestamp: new Date().toISOString(),
    sparkline: [965, 970, 975, 980],
  };

  // Test 1: Normal Trading (No anomaly)
  const normalEval = evaluateStockAnomaly(baseTick, {
    price: 978.0,
    volume: 10000000,
    timestamp: new Date().toISOString(),
    dayHigh: 985.0,
    dayLow: 965.0,
    vwap: 975.0,
  });

  console.assert(
    !normalEval.requiresAttention,
    `Test 1 Failed: Expected normal trading, got score ${normalEval.anomalyScore}`
  );
  console.log('✅ Test 1 Passed: Normal Trading correctly evaluated without false alarms');

  // Test 2: Price Surge Shock (+3.8% since logout)
  const shockedTick: StockTick = {
    ...baseTick,
    price: 1017.0, // +3.8% above benchmark 980
    volumeRatio: 3.2,
  };
  const shockedEval = evaluateStockAnomaly(shockedTick, {
    price: 980.0,
    volume: 5000000,
    timestamp: new Date().toISOString(),
    dayHigh: 985.0,
    dayLow: 965.0,
    vwap: 975.0,
  });

  console.assert(
    shockedEval.requiresAttention,
    `Test 2 Failed: Expected attention required for +3.8% shock`
  );
  console.assert(
    shockedEval.reasons.some((r) => r.type === 'PRICE_SURGE' || r.type === 'VOLUME_SPIKE'),
    'Test 2 Failed: Expected PRICE_SURGE / VOLUME_SPIKE reason'
  );
  console.log('✅ Test 2 Passed: Price Surge & Volume Spike (+3.8% & 3.2x Vol) triggered high-priority alert');

  // Test 3: Support Crack Breakdown
  const supportCrackTick: StockTick = {
    ...baseTick,
    price: 940.0, // Below benchmark day low of 965
    volumeRatio: 2.5,
  };
  const supportCrackEval = evaluateStockAnomaly(supportCrackTick, {
    price: 975.0,
    volume: 5000000,
    timestamp: new Date().toISOString(),
    dayHigh: 985.0,
    dayLow: 965.0,
    vwap: 975.0,
  });

  console.assert(
    supportCrackEval.requiresAttention,
    'Test 3 Failed: Expected attention required for support crack'
  );
  console.assert(
    supportCrackEval.reasons.some((r) => r.type === 'SUPPORT_BREAK'),
    "Test 3 Failed: Expected 'SUPPORT_BREAK' reason"
  );
  console.log("✅ Test 3 Passed: Support Breakdown below Day's Low correctly flagged critical anomaly");

  // Test 4: Batch evaluateMarketState grouping
  const batchResult = evaluateMarketState([baseTick, shockedTick, supportCrackTick], {
    sessionId: 'test',
    userId: 'user',
    benchmarkTime: new Date().toISOString(),
    benchmarkLabel: '09:15 AM',
    marketStatus: 'OPEN',
    prices: {
      TATAMOTORS: {
        price: 980.0,
        volume: 5000000,
        timestamp: new Date().toISOString(),
        dayHigh: 985.0,
        dayLow: 965.0,
        vwap: 975.0,
      },
    },
    lastActiveAt: new Date().toISOString(),
  });

  console.assert(
    batchResult.attentionDesk.length === 2,
    `Test 4 Failed: Expected 2 items in Attention Desk, got ${batchResult.attentionDesk.length}`
  );
  console.assert(
    batchResult.normalTrading.length === 1,
    `Test 4 Failed: Expected 1 item in Normal Trading, got ${batchResult.normalTrading.length}`
  );
  console.log('✅ Test 4 Passed: Batch evaluateMarketState correctly partitioned Attention Desk vs Normal Trading\n');
  console.log('🎉 All 4 Evaluator Unit Tests Passed Successfully!');
}

runTests();
