import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@core/ApiError';
import logger from '@core/logger';

/**
 * Global error handler middleware.
 * Must be registered LAST with app.use().
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof ApiError) {
        // Known operational error – log at warn level
        logger.warn(`[${req.method}] ${req.path} – ${err.statusCode}: ${err.message}`);
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors }),
        });
        return;
    }

    // Unknown / programming error – log full stack
    logger.error(`Unhandled error on [${req.method}] ${req.path}:`, err);
    res.status(500).json({
        success: false,
        message:
            process.env.NODE_ENV === 'production'
                ? 'Internal Server Error'
                : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}
