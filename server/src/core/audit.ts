import prisma from '@infrastructure/database/prisma';
import { Prisma } from '@prisma/client';

interface AuditParams {
    shopId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: Prisma.JsonValue;
    newData?: Prisma.JsonValue;
    ipAddress?: string;
}

export async function recordAudit({
    shopId,
    userId,
    action,
    entityType,
    entityId,
    oldData,
    newData,
    ipAddress,
}: AuditParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                shopId,
                userId,
                action,
                entityType,
                entityId,
                oldData,
                newData,
                ipAddress,
            },
        });
    } catch {
        // Audit logging must never break the main flow.
    }
}

