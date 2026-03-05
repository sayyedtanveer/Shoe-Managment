import prisma from '@infrastructure/database/prisma';
import { ocrQueue } from './ocr.queue';

export interface OcrParsedItem {
    name: string;
    quantity?: number;
    price?: number;
    color?: string;
    size?: number;
    locationId?: number;
    model?: string;
}

export class OcrService {
    async enqueueOcr(filePath: string) {
        const job = await ocrQueue.add('ocr-upload' as any, { filePath }, {
            removeOnComplete: 50,
            removeOnFail: 50,
        });
        return job.id;
    }

    async getJobStatus(id: string) {
        const job = await ocrQueue.getJob(id);
        if (!job) return null;

        const state = await job.getState();

        return {
            id: job.id,
            state,
            progress: Number(job.progress ?? 0),
            result: state === 'completed' ? await job.returnvalue : null,
            failedReason: job.failedReason ?? null,
        };
    }

    async confirmParsedItems(shopId: string, items: OcrParsedItem[], mappingRules?: Record<string, string>) {
        const createdOrUpdated: Array<{ productId: string; variantId: string; name: string }> = [];

        for (const item of items) {
            const productName = item.name?.trim();
            if (!productName) continue;

            const modelName = item.model?.trim() || productName;
            const existingProduct = await prisma.product.findFirst({
                where: { shopId, model: { equals: modelName, mode: 'insensitive' } },
            });

            const product = existingProduct
                ? await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: {
                        purchasePrice: item.price ?? existingProduct.purchasePrice,
                        sellingPrice: item.price ?? existingProduct.sellingPrice,
                        mrp: item.price ?? existingProduct.mrp,
                    },
                })
                : await prisma.product.create({
                    data: {
                        shop: { connect: { id: shopId } },
                        model: modelName,
                        description: 'Created from OCR import',
                        purchasePrice: item.price,
                        sellingPrice: item.price,
                        mrp: item.price,
                        isActive: true,
                    },
                });

            const existingVariant = await prisma.productVariant.findFirst({
                where: {
                    shopId,
                    productId: product.id,
                    size: item.size ?? undefined,
                    color: item.color?.trim() || null,
                },
            });

            const variant = existingVariant
                ? await prisma.productVariant.update({
                    where: { id: existingVariant.id },
                    data: {
                        quantity: { increment: item.quantity ?? 0 },
                        ...(item.locationId ? { location: { connect: { id: item.locationId } } } : {}),
                    },
                })
                : await prisma.productVariant.create({
                    data: {
                        shop: { connect: { id: shopId } },
                        product: { connect: { id: product.id } },
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity ?? 0,
                        ...(item.locationId ? { location: { connect: { id: item.locationId } } } : {}),
                    },
                });

            createdOrUpdated.push({ productId: product.id, variantId: variant.id, name: product.model });
        }

        return {
            count: createdOrUpdated.length,
            mappingRules: mappingRules ?? {},
            items: createdOrUpdated,
        };
    }
}
