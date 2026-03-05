import { BaseController } from '@core/BaseController';
import { BadRequestError } from '@core/ApiError';
import { sendSuccess } from '@core/ApiResponse';
import { Request, Response } from 'express';
import { ReportService } from './report.service';

export class ReportController extends BaseController {
    private svc = new ReportService();

    private shopId(req: Request): string {
        if (!req.shopId) throw new BadRequestError('Tenant context required');
        return req.shopId;
    }

    sales = this.asyncHandler(async (req: Request, res: Response) => {
        const from = String(req.query.from ?? '');
        const to = String(req.query.to ?? '');
        const groupBy = (req.query.groupBy ?? 'day') as 'day' | 'product' | 'salesman';
        if (!['day', 'product', 'salesman'].includes(groupBy)) {
            throw new BadRequestError('groupBy must be day|product|salesman');
        }
        const report = await this.svc.sales(this.shopId(req), from, to, groupBy);
        sendSuccess(res, report, 'Sales report');
    });

    inventory = this.asyncHandler(async (req: Request, res: Response) => {
        const report = await this.svc.inventory(this.shopId(req));
        sendSuccess(res, report, 'Inventory report');
    });

    gst = this.asyncHandler(async (req: Request, res: Response) => {
        const month = String(req.query.month ?? '');
        const report = await this.svc.gst(this.shopId(req), month);
        sendSuccess(res, report, 'GST report');
    });
}
