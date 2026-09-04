import { FastifyPluginAsync } from 'fastify';
import { feedService } from '../services/feed.service.js';
import { deltaService } from '../services/delta.service.js';
import { DEFAULT_USER_ID } from '../lib/store.js';

export const streamRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/stream/ticks
   * Architectural Choice: Server-Sent Events (SSE) over WebSockets.
   * For financial market watchlists, data flow is strictly unidirectional (server -> client).
   * SSE provides native HTTP/2 multiplexing, automatic browser reconnection via EventSource,
   * zero WebSocket upgrade handshake overhead, and seamless corporate proxy traversal.
   */
  fastify.get('/ticks', async (request, reply) => {
    // Standard SSE streaming headers
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    // Disable reverse proxy (Nginx) response buffering to ensure immediate delivery of tick frames
    reply.raw.setHeader('X-Accel-Buffering', 'no');

    // Send initial snapshot evaluation
    const initialMarket = deltaService.evaluateCurrentMarket(DEFAULT_USER_ID);
    const feedHealth = feedService.getHealth();

    const initialData = JSON.stringify({
      type: 'INITIAL_STATE',
      timestamp: new Date().toISOString(),
      snapshot: initialMarket.snapshot,
      ticks: initialMarket.allEvaluations.map((e) => ({
        symbol: e.symbol,
        name: e.name,
        price: e.currentPrice,
        priceDelta: e.priceDelta,
        priceDeltaPercent: e.priceDeltaPercent,
        dayChangePercent: e.dayChangePercent,
        volume: e.volume,
        volumeRatio: e.volumeRatio,
        vwap: e.vwap,
        reasons: e.reasons,
        anomalyScore: e.anomalyScore,
        requiresAttention: e.requiresAttention,
        isStale: e.isStale,
      })),
      attentionDesk: initialMarket.attentionDesk,
      feedHealth,
    });

    reply.raw.write(`data: ${initialData}\n\n`);

    // Subscribe to ongoing tick distributions
    const unsubscribe = feedService.subscribe((ticks) => {
      try {
        const evaluated = deltaService.evaluateCurrentMarket(DEFAULT_USER_ID);
        const health = feedService.getHealth();

        const payload = JSON.stringify({
          type: 'TICK_UPDATE',
          timestamp: new Date().toISOString(),
          ticks,
          attentionDesk: evaluated.attentionDesk,
          allEvaluations: evaluated.allEvaluations,
          feedHealth: health,
        });

        reply.raw.write(`data: ${payload}\n\n`);
      } catch (err) {
        // Stream write failed
      }
    });

    // 15-second SSE keep-alive heartbeat
    const keepAliveInterval = setInterval(() => {
      try {
        reply.raw.write(`: heartbeat ${Date.now()}\n\n`);
      } catch (err) {
        clearInterval(keepAliveInterval);
      }
    }, 15000);

    // Clean up when client disconnects
    request.raw.on('close', () => {
      unsubscribe();
      clearInterval(keepAliveInterval);
    });
  });
};
