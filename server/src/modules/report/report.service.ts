import { BadRequestError } from '@core/ApiError';
import { ReportRepository } from './report.repository';

export class ReportService {
    private repo = new ReportRepository();

    async sales(shopId: string, from: string, to: string, groupBy: 'day' | 'product' | 'salesman') {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            throw new BadRequestError('Invalid from/to date');
        }
        return this.repo.sales(shopId, fromDate, toDate, groupBy);
    }

    inventory(shopId: string) {
        return this.repo.inventory(shopId);
    }

    async gst(shopId: string, month: string) {
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(month)) {
            throw new BadRequestError('Month must be in YYYY-MM format');
        }
        const monthStart = new Date(`${month}-01T00:00:00.000Z`);
        const monthEnd = new Date(monthStart);
        monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
        monthEnd.setUTCMilliseconds(monthEnd.getUTCMilliseconds() - 1);
        return this.repo.gst(shopId, monthStart, monthEnd);
    }
}
