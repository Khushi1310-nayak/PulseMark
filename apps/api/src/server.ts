import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { watchlistsRoutes } from './routes/watchlists.js';
import { sessionRoutes } from './routes/session.js';
import { streamRoutes } from './routes/stream.js';
import { stocksRoutes } from './routes/stocks.js';
import { chaosRoutes } from './routes/chaos.js';
import { feedService } from './services/feed.service.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Enable CORS
await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
});

// Add text parser for navigator.sendBeacon requests
fastify.addContentTypeParser('text/plain', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = JSON.parse(body as string);
    done(null, json);
  } catch (err) {
    done(null, body);
  }
});

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    feedHealth: feedService.getHealth(),
  };
});

fastify.get('/api/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    feedHealth: feedService.getHealth(),
  };
});

// Register API routes
await fastify.register(watchlistsRoutes, { prefix: '/api/watchlists' });
await fastify.register(sessionRoutes, { prefix: '/api/session' });
await fastify.register(streamRoutes, { prefix: '/api/stream' });
await fastify.register(stocksRoutes, { prefix: '/api/stocks' });
await fastify.register(chaosRoutes, { prefix: '/api/chaos' });

// Graceful start
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 PulseMark API server running at http://localhost:${PORT}`);
    console.log(`📡 SSE Stream ready at http://localhost:${PORT}/api/stream/ticks`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
