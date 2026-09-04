import { FastifyPluginAsync } from 'fastify';
import { store, DEFAULT_USER_ID } from '../lib/store.js';
import { mockStockService } from '../services/mock.service.js';
import { deltaService } from '../services/delta.service.js';
import { feedService } from '../services/feed.service.js';

export const watchlistsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/watchlists
  fastify.get('/', async (request, reply) => {
    const watchlists = store.getWatchlists();
    return { success: true, data: watchlists };
  });

  // GET /api/watchlists/search-symbols
  fastify.get('/search-symbols', async (request, reply) => {
    const symbols = mockStockService.getSupportedStocks();
    return { success: true, data: symbols };
  });

  // POST /api/watchlists
  fastify.post<{ Body: { name: string; description?: string } }>('/', async (request, reply) => {
    const { name, description } = request.body || {};
    if (!name || name.trim() === '') {
      return reply.status(400).send({ success: false, error: 'Watchlist name is required' });
    }
    const newWatchlist = store.createWatchlist(name.trim(), description?.trim());
    return reply.status(201).send({ success: true, data: newWatchlist });
  });

  // PUT /api/watchlists/:id
  fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; isDefault?: boolean } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const updated = store.updateWatchlist(id, request.body);
      if (!updated) {
        return reply.status(404).send({ success: false, error: 'Watchlist not found' });
      }
      return { success: true, data: updated };
    }
  );

  // DELETE /api/watchlists/:id
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const deleted = store.deleteWatchlist(id);
    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'Watchlist not found' });
    }
    return { success: true, message: 'Watchlist deleted' };
  });

  // POST /api/watchlists/:id/items
  fastify.post<{ Params: { id: string }; Body: { symbol: string; name?: string } }>(
    '/:id/items',
    async (request, reply) => {
      const { id } = request.params;
      const { symbol, name } = request.body || {};
      if (!symbol) {
        return reply.status(400).send({ success: false, error: 'Symbol is required' });
      }

      const stockTick = feedService.getKnownTick(symbol) || mockStockService.getTick(symbol);
      const stockName = name || stockTick?.name || symbol.toUpperCase();

      const updated = store.addItemToWatchlist(id, symbol.toUpperCase(), stockName);
      if (!updated) {
        return reply.status(404).send({ success: false, error: 'Watchlist not found' });
      }

      // Edge case: Benchmark newly added stock to its current price at addition time (T_add)
      deltaService.benchmarkStockOnAddition(DEFAULT_USER_ID, symbol.toUpperCase(), stockTick?.price);

      return { success: true, data: updated };
    }
  );

  // DELETE /api/watchlists/:id/items/:symbol
  fastify.delete<{ Params: { id: string; symbol: string } }>('/:id/items/:symbol', async (request, reply) => {
    const { id, symbol } = request.params;
    const updated = store.removeItemFromWatchlist(id, symbol.toUpperCase());
    if (!updated) {
      return reply.status(404).send({ success: false, error: 'Watchlist not found' });
    }
    return { success: true, data: updated };
  });
};
