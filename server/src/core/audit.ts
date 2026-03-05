import prisma from '@infrastructure/database/prisma';
import { Prisma } from '@prisma/client';

interface AuditParams {
    shopId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: unknown;
    newData?: unknown;
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
                oldData: (oldData ? JSON.parse(JSON.stringify(oldData)) : null) as any,
                newData: (newData ? JSON.parse(JSON.stringify(newData)) : null) as any,
                ipAddress,
            },
        });
    } catch {
        // Audit logging must never break the main flow.
    }
}

