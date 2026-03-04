import { Request, Response } from 'express';
import { z } from 'zod';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { BadRequestError } from '@core/ApiError';
import { QrService } from './qr.service';

const generateSchema = z.object({
    variantIds: z.array(z.string().uuid()).min(1),
});

const printPdfSchema = z.object({
    ids: z.string().min(1),
});

export class QrController extends BaseController {
    private svc = new QrService();

    generate = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = generateSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        if (!req.shopId) {
            throw new BadRequestError('Tenant context required');
        }
        const data = await this.svc.generateForVariants(req.shopId, parsed.data.variantIds);
        sendSuccess(res, data, 'QR codes generated');
    });

    printPdf = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = printPdfSchema.safeParse(req.query);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        if (!req.shopId) {
            throw new BadRequestError('Tenant context required');
        }
        const ids = parsed.data.ids.split(',');
        const pdf = await this.svc.generatePdfForVariants(req.shopId, ids);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="labels.pdf"');
        res.send(pdf);
    });
}

