import { Prisma, OfflineOperation } from '@prisma/client';
import prisma from '@infrastructure/database/prisma';

interface EnqueueOfflineDto {
    shopId: string;
    userId?: string;
    operationType: string;
    data?: Record<string, unknown>;
}

export class OfflineService {
    enqueue(dto: EnqueueOfflineDto): Promise<OfflineOperation> {
        return prisma.offlineOperation.create({
            data: {
                shopId: dto.shopId,
                userId: dto.userId,
                operationType: dto.operationType,
                data: dto.data as Prisma.InputJsonValue,
                synced: false,
            },
        });
    }
}

