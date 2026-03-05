import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { OcrService, OcrParsedItem } from './ocr.service';
import { BadRequestError, NotFoundError } from '@core/ApiError';

const ocrService = new OcrService();

export class OcrController extends BaseController {
    upload = this.asyncHandler(async (req: Request, res: Response) => {
        if (!req.file?.path) {
            throw new BadRequestError('Image file is required');
        }

        const jobId = await ocrService.enqueueOcr(req.file.path);

        return this.ok(res, { jobId }, 'OCR job queued');
    });

    getJob = this.asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const status = await ocrService.getJobStatus(id);
        if (!status) throw new NotFoundError('OCR job not found');

        return this.ok(res, status);
    });

    confirm = this.asyncHandler(async (req: Request, res: Response) => {
        const shopId = req.user?.shopId;
        if (!shopId) throw new BadRequestError('Shop context missing');

        const items = (req.body?.items ?? []) as OcrParsedItem[];
        const mappingRules = req.body?.mappingRules;

        if (!Array.isArray(items)) {
            throw new BadRequestError('items must be an array');
        }

        const result = await ocrService.confirmParsedItems(shopId, items, mappingRules);

        return this.ok(res, result, 'Inventory updated from OCR');
    });
}
