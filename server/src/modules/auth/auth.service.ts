import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { UnauthorizedError, NotFoundError } from '@core/ApiError';
import { getRedis } from '@infrastructure/cache/redis';
import logger from '@core/logger';

export interface LoginDto {
    shopId: string;
    username: string;
    password: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface AuthUser {
    id: string;
    username: string;
    fullName: string | null;
    role: string;
    shopId: string;
}

export class AuthService {
    private readonly repo: AuthRepository;

    constructor() {
        this.repo = new AuthRepository();
    }

    private getJwtExpiry(value: string | undefined, fallback: jwt.SignOptions['expiresIn']): jwt.SignOptions['expiresIn'] {
        return (value as jwt.SignOptions['expiresIn']) ?? fallback;
    }

    // ─── Token generators ───────────────────────────────────────

    private generateAccessToken(user: User): string {
        const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedError('JWT access secret is not configured');
        }

        return jwt.sign(
            { sub: user.id, shopId: user.shopId, role: user.role },
            secret,
            { expiresIn: this.getJwtExpiry(process.env.JWT_ACCESS_EXPIRES_IN, '15m') }
        );
    }

    private generateRefreshToken(user: User): string {
        const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedError('JWT refresh secret is not configured');
        }

        return jwt.sign({ sub: user.id, shopId: user.shopId }, secret, {
            expiresIn: this.getJwtExpiry(process.env.JWT_REFRESH_EXPIRES_IN, '7d'),
        });
    }

    // ─── Store refresh token in Redis ───────────────────────────
    private async storeRefreshToken(userId: string, token: string): Promise<void> {
        try {
            const redis = getRedis();
            const ttlSeconds = 7 * 24 * 60 * 60; // 7 days
            await redis.set(`refresh:${userId}`, token, { EX: ttlSeconds });
        } catch (err) {
            logger.warn('Redis unavailable – refresh token not cached:', err);
        }
    }

    // ─── Login ──────────────────────────────────────────────────
    async login(dto: LoginDto): Promise<{ tokens: TokenPair; user: AuthUser }> {
        const user = await this.repo.findByUsername(dto.shopId, dto.username);

        if (!user) {
            throw new UnauthorizedError('Invalid username or password');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatch) {
            throw new UnauthorizedError('Invalid username or password');
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        await this.storeRefreshToken(user.id, refreshToken);
        await this.repo.recordLogin(user.id);

        return {
            tokens: { accessToken, refreshToken },
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                shopId: user.shopId,
            },
        };
    }

    // ─── PIN login ──────────────────────────────────────────────
    async pinLogin(
        shopId: string,
        username: string,
        pin: string
    ): Promise<{ tokens: TokenPair; user: AuthUser }> {
        const user = await this.repo.findByUsername(shopId, username);

        if (!user || !user.pinCode) {
            throw new UnauthorizedError('Invalid PIN');
        }

        const ok = await bcrypt.compare(pin, user.pinCode);
        if (!ok) {
            throw new UnauthorizedError('Invalid PIN');
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        await this.storeRefreshToken(user.id, refreshToken);
        await this.repo.recordLogin(user.id);

        return {
            tokens: { accessToken, refreshToken },
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                shopId: user.shopId,
            },
        };
    }

    // ─── Refresh tokens ─────────────────────────────────────────
    async refreshTokens(incomingRefreshToken: string): Promise<TokenPair> {
        const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedError('JWT refresh secret is not configured');
        }

        let payload: { sub: string; shopId: string };
        try {
            payload = jwt.verify(incomingRefreshToken, secret) as { sub: string; shopId: string };
        } catch {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        // Validate against Redis
        try {
            const redis = getRedis();
            const stored = await redis.get(`refresh:${payload.sub}`);
            if (stored !== incomingRefreshToken) {
                throw new UnauthorizedError('Refresh token reuse detected');
            }
        } catch (err) {
            if (err instanceof UnauthorizedError) throw err;
            logger.warn('Redis unavailable – skipping refresh token validation');
        }

        const user = await this.repo.findById(payload.sub);
        if (!user || !user.isActive) {
            throw new UnauthorizedError('User not found or inactive');
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        await this.storeRefreshToken(user.id, refreshToken);

        return { accessToken, refreshToken };
    }

    // ─── Logout ─────────────────────────────────────────────────
    async logout(userId: string): Promise<void> {
        try {
            const redis = getRedis();
            await redis.del(`refresh:${userId}`);
        } catch (err) {
            logger.warn('Redis unavailable – logout token not cleared:', err);
        }
    }

    // ─── Current user ────────────────────────────────────────────
    async getMe(userId: string): Promise<AuthUser> {
        const user = await this.repo.findById(userId);
        if (!user) throw new NotFoundError('User not found');
        return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            shopId: user.shopId,
        };
    }
}
