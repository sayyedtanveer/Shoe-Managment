import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { z } from 'zod';
import { sendSuccess } from '@core/ApiResponse';
import { OrderService } from './order.service';
import { BadRequestError } from '@core/ApiError';
import { getRedis } from '@infrastructure/cache/redis';

const createOrderSchema = z.object({
    customerId: z.string().uuid().optional(),
    items: z
        .array(
            z.object({
                variantId: z.string().uuid(),
                quantity: z.number().int().positive(),
            })
        )
        .min(1),
});

const updateStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
});

const completeOrderSchema = z.object({
    paymentMethod: z.string().min(1),
    amountPaid: z.number().min(0),
    discount: z.number().min(0).optional(),
});

const voidOrderSchema = z.object({
    reason: z.string().min(1),
});

const assignCustomerSchema = z.object({
    customerId: z.string().uuid(),
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
        const salesmanId = req.user?.id;
        const idempotencyKeyHeader = req.headers['idempotency-key'] as string | undefined;
        if (idempotencyKeyHeader) {
            const redis = getRedis();
            const key = `idemp:order:${this.shopId(req)}:${idempotencyKeyHeader}`;
            const existingOrderId = await redis.get(key);
            if (existingOrderId) {
                const existingOrder = await this.svc.getById(existingOrderId, this.shopId(req));
                sendSuccess(res, existingOrder, 'Order created', 201);
                return;
            }
        }
        const order = await this.svc.createPending({
            shopId: this.shopId(req),
            salesmanId,
            customerId: parsed.data.customerId,
            items: parsed.data.items,
        });
        if (idempotencyKeyHeader) {
            const redis = getRedis();
            const key = `idemp:order:${this.shopId(req)}:${idempotencyKeyHeader}`;
            await redis.setEx(key, 24 * 60 * 60, order.id);
        }
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

    listPendingForSalesman = this.asyncHandler(async (req: Request, res: Response) => {
        const shopId = this.shopId(req);
        const salesmanId = req.user?.id;
        if (!salesmanId) throw new BadRequestError('User context required');
        const orders = await this.svc.listPendingForSalesman(shopId, salesmanId);
        sendSuccess(res, orders, 'Pending orders for salesman');
    });

    queue = this.asyncHandler(async (req: Request, res: Response) => {
        const orders = await this.svc.listQueue(this.shopId(req));
        sendSuccess(res, orders, 'Pending orders queue');
    });

    complete = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = completeOrderSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        const cashierId = req.user?.id;
        if (!cashierId) throw new BadRequestError('User context required');
        const order = await this.svc.complete(
            this.shopId(req),
            req.params.id,
            cashierId,
            parsed.data.paymentMethod,
            parsed.data.amountPaid,
            parsed.data.discount
        );
        sendSuccess(res, order, 'Order completed');
    });


    assignCustomer = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = assignCustomerSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }

        const order = await this.svc.assignCustomer(this.shopId(req), req.params.id, parsed.data.customerId);
        sendSuccess(res, order, 'Customer assigned to order');
    });

    voidOrder = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = voidOrderSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        const order = await this.svc.voidOrder(this.shopId(req), req.params.id, parsed.data.reason);
        sendSuccess(res, order, 'Order voided');
    });
}
