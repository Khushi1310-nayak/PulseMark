import { FastifyPluginAsync } from 'fastify';
import { mockStockService } from '../services/mock.service.js';
import { deltaService } from '../services/delta.service.js';
import { feedService } from '../services/feed.service.js';
import { store, DEFAULT_USER_ID } from '../lib/store.js';

export const chaosRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/chaos/inject-volatility
  fastify.post<{
    Body: {
      symbol: string;
      deltaPercent: number;
      volumeMultiplier?: number;
      reason?: string;
    };
  }>('/inject-volatility', async (request, reply) => {
    const { symbol, deltaPercent, volumeMultiplier = 3.0, reason } = request.body || {};
    if (!symbol || deltaPercent === undefined) {
      return reply.status(400).send({ success: false, error: 'Symbol and deltaPercent are required' });
    }

    const updated = mockStockService.injectVolatility(symbol, deltaPercent, volumeMultiplier, reason);
    if (!updated) {
      return reply.status(404).send({ success: false, error: `Stock ${symbol} not found` });
    }

    // Log the anomaly trigger
    const snapshot = deltaService.getOrCreateSnapshot(DEFAULT_USER_ID);
    const benchmark = snapshot.prices[symbol.toUpperCase()];
    const deltaAmount = benchmark ? updated.price - benchmark.price : 0;

    const logEntry = store.addAuditLog({
      symbol: symbol.toUpperCase(),
      triggerType: deltaPercent >= 0 ? 'PRICE_SURGE' : 'PRICE_DROP',
      title: reason || `Forced Volatility: ${deltaPercent >= 0 ? '+' : ''}${deltaPercent}% Shock`,
      details: `Simulated anomaly injected. Volume surge: ${volumeMultiplier}x, Price shifted to ₹${updated.price.toFixed(2)}.`,
      deltaAtTrigger: Number(deltaAmount.toFixed(2)),
      priceAtTrigger: updated.price,
      severity: Math.abs(deltaPercent) > 3 ? 'critical' : 'high',
      timestamp: new Date().toISOString(),
    });

    const marketState = deltaService.evaluateCurrentMarket(DEFAULT_USER_ID);

    return {
      success: true,
      message: `Injected ${deltaPercent}% volatility into ${symbol.toUpperCase()}`,
      data: {
        tick: updated,
        auditLog: logEntry,
        attentionDesk: marketState.attentionDesk,
      },
    };
  });

  // POST /api/chaos/time-travel
  fastify.post<{
    Body: {
      minutesAgo: number;
      customLabel?: string;
    };
  }>('/time-travel', async (request, reply) => {
    const { minutesAgo = 120, customLabel } = request.body || {};
    const newSnapshot = deltaService.simulateTimeTravel(DEFAULT_USER_ID, minutesAgo, customLabel);
    const evaluated = deltaService.evaluateCurrentMarket(DEFAULT_USER_ID);

    return {
      success: true,
      message: `Time traveled ${minutesAgo} minutes into past session baseline`,
      data: {
        snapshot: newSnapshot,
        attentionDesk: evaluated.attentionDesk,
        allEvaluations: evaluated.allEvaluations,
      },
    };
  });

  // POST /api/chaos/network
  fastify.post<{
    Body: {
      networkDrop: boolean;
      forceStale?: boolean;
    };
  }>('/network', async (request, reply) => {
    const { networkDrop, forceStale = false } = request.body || {};
    feedService.setSimulatedChaos(networkDrop, forceStale);
    const health = feedService.getHealth();

    return {
      success: true,
      message: networkDrop ? 'Simulated network drop active (Circuit breaker tripped)' : 'Network restored to normal',
      data: health,
    };
  });

  // POST /api/chaos/reset
  fastify.post('/reset', async (request, reply) => {
    const freshSnapshot = deltaService.createDefaultMarketOpenSnapshot(DEFAULT_USER_ID);
    store.setSnapshot(DEFAULT_USER_ID, freshSnapshot);
    feedService.setSimulatedChaos(false, false);
    const evaluated = deltaService.evaluateCurrentMarket(DEFAULT_USER_ID);

    return {
      success: true,
      message: 'State reset to standard market open benchmark (09:15 AM)',
      data: {
        snapshot: freshSnapshot,
        attentionDesk: evaluated.attentionDesk,
      },
    };
  });
};
