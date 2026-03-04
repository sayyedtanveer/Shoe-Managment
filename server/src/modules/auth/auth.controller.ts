import { Request, Response } from 'express';
import { z } from 'zod';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { BadRequestError, UnauthorizedError } from '@core/ApiError';
import { AuthService } from './auth.service';

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    clientType: z.enum(['web', 'mobile']).optional().default('web'),
});

const refreshSchema = z.object({
    refreshToken: z.string().optional(),
    clientType: z.enum(['web', 'mobile']).optional().default('web'),
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

        // Web clients: keep tokens in secure httpOnly cookies.
        if (parsed.data.clientType === 'web') {
            res.cookie('accessToken', tokens.accessToken, {
                ...COOKIE_OPTIONS,
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('refreshToken', tokens.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        // Mobile clients should store tokens in secure app storage.
        sendSuccess(res, { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }, 'Login successful');
    });

    refresh = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = refreshSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }

        const incomingToken: string | undefined =
            parsed.data.clientType === 'web'
                ? req.cookies?.refreshToken ?? parsed.data.refreshToken
                : parsed.data.refreshToken ?? req.cookies?.refreshToken;

        if (!incomingToken) throw new UnauthorizedError('No refresh token provided');

        const tokens = await this.service.refreshTokens(incomingToken);

        if (parsed.data.clientType === 'web') {
            res.cookie('accessToken', tokens.accessToken, {
                ...COOKIE_OPTIONS,
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('refreshToken', tokens.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        sendSuccess(res, tokens, 'Token refreshed');
    });

    logout = this.asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (userId) await this.service.logout(userId);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        sendSuccess(res, null, 'Logged out successfully');
    });

    me = this.asyncHandler(async (req: Request, res: Response) => {
        const user = await this.service.getMe(req.user!.id);
        sendSuccess(res, user, 'Current user');
    });
}
