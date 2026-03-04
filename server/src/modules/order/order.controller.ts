import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { z } from 'zod';
import { sendSuccess } from '@core/ApiResponse';
import { OrderService } from './order.service';
import { BadRequestError } from '@core/ApiError';

const createOrderSchema = z.object({
    salesmanId: z.string().uuid().optional(),
    cashierId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    paymentMethod: z.string().min(1),
    paymentDetails: z.record(z.unknown()).optional(),
    discount: z.number().min(0).optional(),
    items: z
        .array(
            z.object({
                variantId: z.string().uuid(),
                quantity: z.number().int().positive(),
                discount: z.number().min(0).optional(),
            })
        )
        .min(1),
});

const updateStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
});

export class OrderController extends BaseController {
    private svc = new OrderService();

    private shopId(req: Request): string {
        if (!req.shopId) throw new BadRequestError('Tenant context required');
        return req.shopId;
    }

    list = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.list(this.shopId(req), req.query.status as string | undefined), 'Orders');
    });

    getById = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.getById(req.params.id, this.shopId(req)), 'Order');
    });

    create = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = createOrderSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        const order = await this.svc.create({ shopId: this.shopId(req), ...parsed.data });
        sendSuccess(res, order, 'Order created', 201);
    });

    updateStatus = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        sendSuccess(
            res,
            await this.svc.updateStatus(req.params.id, this.shopId(req), parsed.data.status),
            'Order status updated'
        );
    });
}
