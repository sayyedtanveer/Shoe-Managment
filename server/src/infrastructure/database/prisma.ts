import { PrismaClient } from '@prisma/client';
import logger from '@core/logger';

// Prevent multiple PrismaClient instances in development (hot reload)
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
    global.__prisma ??
    new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });

if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;

    // Log slow queries in development
    // @ts-expect-error – Prisma event typing
    prisma.$on('query', (e: { query: string; duration: number }) => {
        if (e.duration > 200) {
            logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
    });
}

// @ts-expect-error – Prisma event typing
prisma.$on('error', (e: { message: string }) => {
    logger.error(`Prisma error: ${e.message}`);
});

export default prisma;
