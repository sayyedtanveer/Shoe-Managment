import { Request, Response, NextFunction } from 'express';
import prisma from '@infrastructure/database/prisma';
import { NotFoundError } from '@core/ApiError';

/**
 * Tenant context middleware.
 *
 * Strategy:
 *  1. Extract subdomain from the Host header (e.g. "friend-shop-dadar.shoeflow.com" → "friend-shop-dadar").
 *  2. Look up the Shop row by slug.
 *  3. Attach shopId and shop object to req for downstream use.
 *
 * In development (localhost) you can pass X-Tenant-Slug header to override.
 */
export async function tenantContext(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Allow override via header for dev / API testing
        let slug = req.headers['x-tenant-slug'] as string | undefined;

        if (!slug) {
            const host = req.hostname; // Express strips port
            // "slug.shoeflow.com" → slug; "localhost" → undefined
            const parts = host.split('.');
            slug = parts.length > 2 ? parts[0] : undefined;
        }

        if (!slug) {
            // No tenant info – pass through (e.g. super-admin routes on the root domain)
            return next();
        }

        const shop = await prisma.shop.findUnique({ where: { slug } });

        if (!shop || !shop.isActive) {
            throw new NotFoundError(`Shop "${slug}" not found or inactive`);
        }

        req.shopId = shop.id;
        req.shop = shop;
        next();
    } catch (err) {
        next(err);
    }
}
