import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;
let isPrismaAvailable = false;

export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!prismaClient) {
    try {
      prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
      isPrismaAvailable = true;
    } catch (err) {
      console.warn('[Prisma] Database connection initialization skipped:', err);
      prismaClient = null;
      isPrismaAvailable = false;
    }
  }
  return prismaClient;
}

export function hasPrisma(): boolean {
  return Boolean(process.env.DATABASE_URL && prismaClient);
}
