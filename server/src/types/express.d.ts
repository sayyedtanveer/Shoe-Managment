import { Shop } from '@prisma/client';

/**
 * Extend Express Request with ShoeFlow-specific fields.
 */
declare global {
    namespace Express {
        interface Request {
            /** Attached by tenantContext middleware */
            shopId?: string;
            shop?: Shop;

            /** Attached by authenticate middleware */
            user?: {
                id: string;
                shopId: string;
                role: string;
            };
        }
    }
}
