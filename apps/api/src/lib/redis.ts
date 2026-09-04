import { Redis } from 'ioredis';

let redisClient: Redis | null = null;
const inMemoryCache = new Map<string, { value: string; expiry?: number }>();

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!redisUrl) return null;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });
    redisClient.on('error', (err: Error) => {
      console.warn('[Redis] Connection warning, falling back to in-memory store:', err.message);
    });
    return redisClient;
  } catch (err) {
    console.warn('[Redis] Failed to initialize Redis client:', err);
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const client = getRedisClient();
  if (client && client.status === 'ready') {
    if (ttlSeconds) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      await client.set(key, value);
    }
  } else {
    inMemoryCache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  if (client && client.status === 'ready') {
    return await client.get(key);
  }
  const item = inMemoryCache.get(key);
  if (!item) return null;
  if (item.expiry && Date.now() > item.expiry) {
    inMemoryCache.delete(key);
    return null;
  }
  return item.value;
}
