import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import prisma from '@infrastructure/database/prisma';
import { BadRequestError, NotFoundError } from '@core/ApiError';

export class ScanController extends BaseController {
    scanByCode = this.asyncHandler(async (req: Request, res: Response) => {
        const { code } = req.params;
        if (!req.shopId) {
            throw new BadRequestError('Tenant context required');
        }

        const variant = await prisma.productVariant.findFirst({
            where: { id: code, shopId: req.shopId },
            include: { product: true },
        });

        if (!variant) {
            throw new NotFoundError('Variant not found for this shop');
        }

        const data = {
            id: variant.id,
            productName: variant.product.model,
            size: variant.size,
            color: variant.color,
            sellingPrice: variant.product.sellingPrice,
            image: variant.product.images?.[0] ?? null,
        };

        sendSuccess(res, data, 'Variant scan result');
    });
}

