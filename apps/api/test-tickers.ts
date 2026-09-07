import YahooFinance from 'yahoo-finance2';
import { SYMBOL_TO_YAHOO } from './src/services/feed.service.js';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function auditTickers() {
  console.log('🔍 Auditing all 18 NSE equities against Yahoo Finance Live Feed...\n');
  const entries = Object.entries(SYMBOL_TO_YAHOO);
  let successCount = 0;
  let failCount = 0;

  for (const [symbol, yahooTicker] of entries) {
    try {
      const q: any = await yf.quote(yahooTicker);
      if (q && q.regularMarketPrice !== undefined && q.regularMarketPrice !== null) {
        console.log(`✅ [${symbol.padEnd(12)}] (${yahooTicker.padEnd(14)}) => Price: ₹${q.regularMarketPrice.toFixed(2)} | Change: ${q.regularMarketChangePercent?.toFixed(2)}% | Day: ₹${q.regularMarketDayLow} - ₹${q.regularMarketDayHigh} | Name: ${q.shortName || q.longName}`);
        successCount++;
      } else {
        console.error(`❌ [${symbol.padEnd(12)}] (${yahooTicker.padEnd(14)}) => Returned empty or undefined price`);
        failCount++;
      }
    } catch (err: any) {
      console.error(`❌ [${symbol.padEnd(12)}] (${yahooTicker.padEnd(14)}) => ERROR: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Audit Summary: ${successCount}/${entries.length} Succeeded (${failCount} Failed)`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

auditTickers().catch((e) => {
  console.error('Audit fatal error:', e);
  process.exit(1);
});
