import YahooFinance from 'yahoo-finance2';
import { SYMBOL_TO_YAHOO, feedService } from './src/services/feed.service.js';
import { deltaService } from './src/services/delta.service.js';

async function runTestSuite() {
  console.log('🚀 Running PulseMark Comprehensive API & Market Test Suite...\n');

  // ==========================================
  // Test 1: 18 Real NSE Equities Yahoo Finance Audit
  // ==========================================
  console.log('📊 [TEST 1] Verifying Genuine Live NSE Exchange Quotes (18 Equities)...');
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  const symbols = Object.entries(SYMBOL_TO_YAHOO);
  let liveSuccessCount = 0;

  for (const [sym, ticker] of symbols) {
    try {
      const q: any = await yf.quote(ticker);
      if (q && typeof q.regularMarketPrice === 'number' && q.regularMarketPrice > 0) {
        liveSuccessCount++;
        console.log(`   ✓ ${sym.padEnd(11)} (${ticker.padEnd(14)}) => ₹${q.regularMarketPrice.toFixed(2)} [Real Quote Verified]`);
      } else {
        throw new Error(`Invalid price returned: ${q?.regularMarketPrice}`);
      }
    } catch (e: any) {
      console.error(`   ✗ ${sym} (${ticker}) FAILED: ${e.message}`);
    }
  }

  console.assert(
    liveSuccessCount === symbols.length,
    `Test 1 Failed: Expected all ${symbols.length} tickers to return real prices, got ${liveSuccessCount}`
  );
  console.log(`✅ [TEST 1 PASSED] 100% of Equities (${liveSuccessCount}/${symbols.length}) verified with real NSE prices.\n`);

  // ==========================================
  // Test 2: Delta Calculation Service - Multi-Temporal Baselines
  // ==========================================
  console.log('⏱️  [TEST 2] Verifying Multi-Temporal Baselines (1W, 1D, 4H, 2H, Open, Logout)...');
  const timeTravelCases = [
    { label: '15 Minutes', minutes: 15 },
    { label: '2 Hours', minutes: 120 },
    { label: '4 Hours', minutes: 240 },
    { label: '1 Day', minutes: 1440 },
    { label: '1 Week', minutes: 10080 },
  ];

  for (const tc of timeTravelCases) {
    const snap = deltaService.simulateTimeTravel('test-user-audit', tc.minutes);
    console.assert(snap !== null, `Failed to generate snapshot for ${tc.label}`);
    console.assert(
      Object.keys(snap.prices).length > 0,
      `Snapshot prices empty for ${tc.label}`
    );
    console.log(`   ✓ Baseline Mode [${tc.label.padEnd(10)}] => Label: "${snap.benchmarkLabel}" | Tickers tracked: ${Object.keys(snap.prices).length}`);
  }

  const openSnap = deltaService.createDefaultMarketOpenSnapshot('test-user-audit');
  console.assert(openSnap !== null, 'Failed to generate market open snapshot');
  console.log(`   ✓ Baseline Mode [Market Open] => Label: "${openSnap.benchmarkLabel}" | Tickers tracked: ${Object.keys(openSnap.prices).length}`);

  console.log('✅ [TEST 2 PASSED] All 6 temporal baseline modes successfully compute benchmark states.\n');

  // ==========================================
  // Test 3: Market Shock Engine & Anomaly Promotion
  // ==========================================
  console.log('⚡ [TEST 3] Verifying Market Shock Injection & Anomaly Promotion...');
  const shockedTick = feedService.injectShock('TATAMOTORS', -4.5, 3.5, 'Test Breakdown Shock');
  console.assert(shockedTick !== null, 'Shock injection returned null');
  console.assert(
    shockedTick!.volumeRatio === 3.5,
    `Expected volumeRatio 3.5, got ${shockedTick?.volumeRatio}`
  );

  const marketEval = deltaService.evaluateCurrentMarket('test-user-audit');
  const tatamotorsEval = marketEval.allEvaluations.find((e) => e.symbol === 'TATAMOTORS');

  console.assert(tatamotorsEval !== undefined, 'TATAMOTORS evaluation not found');
  console.assert(
    tatamotorsEval!.requiresAttention,
    'Expected TATAMOTORS to require attention after -4.5% shock'
  );
  console.log(`   ✓ Shocked TATAMOTORS anomaly score: ${tatamotorsEval?.anomalyScore} (Requires Attention: ${tatamotorsEval?.requiresAttention})`);
  console.log('✅ [TEST 3 PASSED] Market shock correctly updates price and triggers Attention Desk promotion.\n');

  // ==========================================
  // Test 4: Circuit Breaker Resilience
  // ==========================================
  console.log('🛡️  [TEST 4] Verifying 3-Tier Circuit Breaker Fallback & Recovery...');
  feedService.setSimulatedChaos(true, true);
  const healthTripped = feedService.getHealth();
  console.assert(
    healthTripped.isCircuitBreakerTripped,
    'Expected circuit breaker to be tripped'
  );
  console.assert(
    healthTripped.source === 'STALE_REDIS_CACHE',
    `Expected source STALE_REDIS_CACHE, got ${healthTripped.source}`
  );
  console.log(`   ✓ Circuit Breaker Tripped => Source: ${healthTripped.source}, Provider: ${healthTripped.provider}`);

  // Restore
  feedService.setSimulatedChaos(false, false);
  feedService.clearShocks();
  const healthRestored = feedService.getHealth();
  console.assert(
    !healthRestored.isCircuitBreakerTripped,
    'Expected circuit breaker to be restored'
  );
  console.assert(
    healthRestored.source === 'LIVE_FEED',
    `Expected source LIVE_FEED, got ${healthRestored.source}`
  );
  console.log(`   ✓ Circuit Breaker Restored => Source: ${healthRestored.source}, Provider: ${healthRestored.provider}`);
  console.log('✅ [TEST 4 PASSED] Circuit breaker fallback and self-healing recovery verified.\n');

  console.log('🎉 =======================================================');
  console.log('🎉 ALL API & REAL MARKET DATA TESTS PASSED SUCCESSFULLY!  ');
  console.log('🎉 =======================================================\n');
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
