import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { BadRequestError, UnauthorizedError } from '@core/ApiError';
import { AuthService } from './auth.service';

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
};

export class AuthController extends BaseController {
    private readonly service: AuthService;

    constructor() {
        super();
        this.service = new AuthService();
    }

    // POST /api/auth/login
    login = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }

        const shopId = req.shopId;
        if (!shopId) throw new BadRequestError('Tenant not resolved. Use X-Tenant-Slug header or subdomain.');

        const { tokens, user } = await this.service.login({
            shopId,
            username: parsed.data.username,
            password: parsed.data.password,
        });

        // Set httpOnly cookies for web clients
        res.cookie('accessToken', tokens.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 15 * 60 * 1000, // 15 min
        });
        res.cookie('refreshToken', tokens.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Login successful');
    });

    // POST /api/auth/refresh
    refresh = this.asyncHandler(async (req: Request, res: Response) => {
        const incomingToken: string | undefined =
            req.cookies?.refreshToken ?? req.body?.refreshToken;

        if (!incomingToken) throw new UnauthorizedError('No refresh token provided');

        const tokens = await this.service.refreshTokens(incomingToken);

        res.cookie('accessToken', tokens.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refreshToken', tokens.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
    });

    // POST /api/auth/logout
    logout = this.asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (userId) await this.service.logout(userId);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        sendSuccess(res, null, 'Logged out successfully');
    });

    // GET /api/auth/me
    me = this.asyncHandler(async (req: Request, res: Response) => {
        const user = await this.service.getMe(req.user!.id);
        sendSuccess(res, user, 'Current user');
    });
}
