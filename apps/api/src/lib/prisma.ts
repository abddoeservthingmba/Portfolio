import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * One client for the process. Prisma manages its own connection pool, so a
 * second instance means a second pool — which matters on a free-tier database
 * with a low connection ceiling.
 *
 * The global cache exists for `tsx watch`: a reload would otherwise construct a
 * fresh client on every file save and exhaust connections within a minute.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query logs are noisy and can carry parameter values; development only.
    log: env.isProduction ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

/** Cheap round trip used by the health endpoint to prove the database answers. */
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
