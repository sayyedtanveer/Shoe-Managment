import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { OrderService } from './order.service';
import { BadRequestError } from '@core/ApiError';

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
        const order = await this.svc.create({ shopId: this.shopId(req), ...req.body });
        sendSuccess(res, order, 'Order created', 201);
    });

    updateStatus = this.asyncHandler(async (req: Request, res: Response) => {
        const { status } = req.body;
        sendSuccess(res, await this.svc.updateStatus(req.params.id, this.shopId(req), status), 'Order status updated');
    });
}
