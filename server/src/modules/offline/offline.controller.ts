import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { BadRequestError } from '@core/ApiError';
import { z } from 'zod';
import { OfflineService } from './offline.service';

const enqueueSchema = z.object({
    operationType: z.string().min(1),
    data: z.record(z.unknown()).optional(),
});

export class OfflineController extends BaseController {
    private svc = new OfflineService();

    enqueue = this.asyncHandler(async (req: Request, res: Response) => {
        if (!req.shopId) {
            throw new BadRequestError('Tenant context required');
        }

        const parsed = enqueueSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }

        const op = await this.svc.enqueue({
            shopId: req.shopId,
            userId: req.user?.id,
            operationType: parsed.data.operationType,
            data: parsed.data.data,
        });

        sendSuccess(res, op, 'Offline operation enqueued', 201);
    });
}

