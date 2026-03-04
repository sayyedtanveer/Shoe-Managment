import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * BaseController – wraps async route handlers so errors are passed to next().
 * Usage:
 *   class MyController extends BaseController {
 *     doSomething = this.asyncHandler(async (req, res) => { ... });
 *   }
 */
export abstract class BaseController {
    /**
     * Wraps an async request handler, catching any thrown errors and
     * forwarding them to Express's error-handling middleware.
     */
    protected asyncHandler(
        fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
    ): RequestHandler {
        return (req: Request, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}
