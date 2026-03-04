import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { TenantService } from './tenant.service';

export class TenantController extends BaseController {
    private svc = new TenantService();

    getAll = this.asyncHandler(async (_req: Request, res: Response) => {
        sendSuccess(res, await this.svc.getAll(), 'All shops');
    });

    getById = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.getById(req.params.id), 'Shop details');
    });

    create = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.create(req.body), 'Shop created', 201);
    });

    update = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.update(req.params.id, req.body), 'Shop updated');
    });

    deactivate = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.deactivate(req.params.id), 'Shop deactivated');
    });
}
