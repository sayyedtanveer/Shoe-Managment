import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { CustomerService } from './customer.service';
import { BadRequestError } from '@core/ApiError';

export class CustomerController extends BaseController {
    private svc = new CustomerService();

    private shopId(req: Request): string {
        if (!req.shopId) throw new BadRequestError('Tenant context required');
        return req.shopId;
    }

    list = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.list(this.shopId(req), req.query.search as string | undefined), 'Customers');
    });

    getById = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.getById(req.params.id, this.shopId(req)), 'Customer');
    });

    lookup = this.asyncHandler(async (req: Request, res: Response) => {
        const c = await this.svc.lookupByPhone(String(req.query.phone ?? ''), this.shopId(req));
        sendSuccess(res, c, c ? 'Customer found' : 'Customer not found');
    });

    create = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.create(this.shopId(req), req.body), 'Customer created', 201);
    });

    update = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.update(req.params.id, this.shopId(req), req.body), 'Customer updated');
    });

    addLoyalty = this.asyncHandler(async (req: Request, res: Response) => {
        const { points } = req.body;
        sendSuccess(res, await this.svc.addLoyaltyPoints(req.params.id, Number(points)), 'Loyalty points added');
    });

    redeemLoyalty = this.asyncHandler(async (req: Request, res: Response) => {
        const { points } = req.body;
        sendSuccess(
            res,
            await this.svc.redeemLoyaltyPoints(req.params.id, this.shopId(req), Number(points)),
            'Loyalty points redeemed'
        );
    });
}
