import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '@core/logger';

interface SocketUserData {
    userId: string;
    shopId: string;
    role: string;
}

let io: Server | null = null;

export function initSocket(httpServer: HttpServer, allowedOrigins: string[]): Server {
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    io.use((socket, next) => {
        try {
            const token =
                (socket.handshake.auth?.token as string | undefined) ||
                (socket.handshake.headers.authorization as string | undefined)?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('No auth token provided'));
            }

            const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
            if (!secret) return next(new Error('JWT secret not configured'));

            const decoded = jwt.verify(token, secret) as {
                sub: string;
                shopId: string;
                role: string;
            };

            (socket.data as SocketUserData).userId = decoded.sub;
            (socket.data as SocketUserData).shopId = decoded.shopId;
            (socket.data as SocketUserData).role = decoded.role;

            next();
        } catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        const data = socket.data as SocketUserData;
        logger.info(`Socket connected user=${data.userId} shop=${data.shopId} role=${data.role}`);

        socket.on('join_counter', () => {
            const room = `shop:${data.shopId}:counter`;
            socket.join(room);
        });

        socket.on('disconnect', () => {
            logger.info(`Socket disconnected user=${data.userId}`);
        });
    });

    return io;
}

export function getIO(): Server {
    if (!io) {
        throw new Error('Socket.io has not been initialised');
    }
    return io;
}

