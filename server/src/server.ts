import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import logger from '@core/logger';
import prisma from '@infrastructure/database/prisma';
import { connectRedis } from '@infrastructure/cache/redis';
import { initSocket } from './realtime/socket';

const PORT = Number(process.env.PORT ?? 5000);

async function bootstrap(): Promise<void> {
    try {
        await prisma.$connect();
        logger.info('PostgreSQL connected');

        await connectRedis();

        const httpServer = createServer(app);

        const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',');
        initSocket(httpServer, allowedOrigins);

        httpServer.listen(PORT, () => {
            logger.info(
                `🚀 ShoeFlow server with Socket.io running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`
            );
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received – shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received – shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});

bootstrap();
