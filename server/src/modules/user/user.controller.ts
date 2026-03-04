import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { UserService } from './user.service';
import { BadRequestError } from '@core/ApiError';

export class UserController extends BaseController {
    private svc = new UserService();

    private shopId(req: Request): string {
        if (!req.shopId) throw new BadRequestError('Tenant context required');
        return req.shopId;
    }

    list = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.list(this.shopId(req)), 'Users');
    });

    getById = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.getById(req.params.id, this.shopId(req)), 'User');
    });

    create = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.create(this.shopId(req), req.body), 'User created', 201);
    });

    update = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.update(req.params.id, this.shopId(req), req.body), 'User updated');
    });

    activate = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.toggleActive(req.params.id, this.shopId(req), true), 'User activated');
    });

    deactivate = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.toggleActive(req.params.id, this.shopId(req), false), 'User deactivated');
    });
}
