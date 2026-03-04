import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ForbiddenError } from '@core/ApiError';

/**
 * Role-based authorization middleware factory.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('admin'), controller.action);
 *   router.get('/any-staff', authenticate, authorize('admin', 'salesman', 'cashier'), …);
 */
export function authorize(...allowedRoles: string[]): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const userRole = req.user?.role;

        if (!userRole) {
            return next(new ForbiddenError('No role assigned'));
        }

        if (!allowedRoles.includes(userRole)) {
            return next(
                new ForbiddenError(
                    `Role "${userRole}" is not permitted to access this resource`
                )
            );
        }

        next();
    };
}
