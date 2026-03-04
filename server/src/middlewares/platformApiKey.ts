import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@core/ApiError';

export function platformApiKey(req: Request, _res: Response, next: NextFunction): void {
    const provided = (req.headers['x-api-key'] as string | undefined)?.trim();
    const expected = process.env.PLATFORM_API_KEY;

    if (!expected || !provided || provided !== expected) {
        throw new UnauthorizedError('Invalid or missing platform API key');
    }

    next();
}

