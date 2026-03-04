import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@core/ApiError';

export interface JwtPayload {
    sub: string;
    shopId: string;
    role: string;
    iat?: number;
    exp?: number;
}

/**
 * Authenticate middleware.
 * Reads JWT access tokens from:
 *   1) Authorization header (mobile + web APIs)
 *   2) accessToken httpOnly cookie (web)
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
    try {
        let token: string | undefined;

        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }

        if (!token && req.cookies?.accessToken) {
            token = req.cookies.accessToken as string;
        }

        if (!token) {
            throw new UnauthorizedError('No authentication token provided');
        }

        const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_ACCESS_SECRET or JWT_SECRET is not set');

        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = {
            id: decoded.sub,
            shopId: decoded.shopId,
            role: decoded.role,
        };

        next();
    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid or expired token'));
            return;
        }

        next(err);
    }
}
