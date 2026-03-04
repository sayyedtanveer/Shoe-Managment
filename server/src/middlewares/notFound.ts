import { Request, Response, NextFunction } from 'express';

/**
 * 404 handler – catches any request that didn't match a route.
 * Register BEFORE the global error handler.
 */
export function notFound(req: Request, res: Response, _next: NextFunction): void {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
}
