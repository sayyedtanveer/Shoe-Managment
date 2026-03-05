import { Shop } from '@prisma/client';
import type { Express } from 'express';

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

            /** Attached by multer middleware */
            file?: {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                size: number;
                destination: string;
                filename: string;
                path: string;
                buffer?: Buffer;
            };
        }
    }
}
