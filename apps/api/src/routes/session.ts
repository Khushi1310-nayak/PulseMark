import { FastifyPluginAsync } from 'fastify';
import { deltaService } from '../services/delta.service.js';
import { feedService } from '../services/feed.service.js';
import { store, DEFAULT_USER_ID } from '../lib/store.js';
import { SensitivityConfig } from '@pulsemark/shared';

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/session/snapshot
  fastify.get('/snapshot', async (request, reply) => {
    const marketState = deltaService.evaluateCurrentMarket(DEFAULT_USER_ID);
    const feedHealth = feedService.getHealth();

    return {
      success: true,
      data: {
        snapshot: marketState.snapshot,
        attentionDesk: marketState.attentionDesk,
        allEvaluations: marketState.allEvaluations,
        feedHealth,
      },
    };
  });

  // POST /api/session/snapshot (Used by navigator.sendBeacon or tab blur)
  fastify.post('/snapshot', async (request, reply) => {
    const { ticks } = await feedService.getLatestTicks();
    const newSnapshot = deltaService.commitSnapshot(DEFAULT_USER_ID, ticks);
    return {
      success: true,
      message: 'Snapshot committed successfully',
      data: newSnapshot,
    };
  });

  // POST /api/session/heartbeat (30-second ping)
  fastify.post('/heartbeat', async (request, reply) => {
    const snapshot = deltaService.getOrCreateSnapshot(DEFAULT_USER_ID);
    snapshot.lastActiveAt = new Date().toISOString();
    store.setSnapshot(DEFAULT_USER_ID, snapshot);

    return {
      success: true,
      lastActiveAt: snapshot.lastActiveAt,
      isLive: true,
    };
  });

  // GET /api/session/settings
  fastify.get('/settings', async (request, reply) => {
    const settings = store.getSettings();
    return { success: true, data: settings };
  });

  // PUT /api/session/settings
  fastify.put<{ Body: Partial<SensitivityConfig> }>('/settings', async (request, reply) => {
    const updated = store.updateSettings(request.body || {});
    return { success: true, data: updated };
  });
};
