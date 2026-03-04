import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@core/ApiError';

export interface JwtPayload {
    sub: string;    // user id
    shopId: string;
    role: string;
    iat?: number;
    exp?: number;
}

/**
 * Authenticate middleware.
 * Reads the JWT access token from:
 *   1. Authorization: Bearer <token>   (web / mobile API calls)
 *   2. accessToken httpOnly cookie      (web SPA)
 *
 * Attaches req.user on success.
 */
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        let token: string | undefined;

        // 1. Bearer token (Authorization header)
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }

        // 2. httpOnly cookie fallback
        if (!token && req.cookies?.accessToken) {
            token = req.cookies.accessToken as string;
        }

        if (!token) {
            throw new UnauthorizedError('No authentication token provided');
        }

        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');

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
        } else {
            next(err);
        }
    }
}
