import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { tenantContext } from '@middlewares/tenantContext';
import { errorHandler } from '@middlewares/errorHandler';
import { notFound } from '@middlewares/notFound';

// ── Module routers ──────────────────────────────────────────
import authRouter from '@modules/auth/auth.router';
import tenantRouter from '@modules/tenant/tenant.router';
import userRouter from '@modules/user/user.router';
import inventoryRouter from '@modules/inventory/inventory.router';
import orderRouter from '@modules/order/order.router';
import customerRouter from '@modules/customer/customer.router';
import offlineRouter from '@modules/offline/offline.router';
import qrRouter from '@modules/qr/qr.router';
import scanRouter from '@modules/scan/scan.router';
import ocrRouter from '@modules/ocr/ocr.router';

const app: Application = express();

// ── Security ────────────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1);

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',');
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin "${origin}" not allowed`));
            }
        },
        credentials: true,
    })
);

// ── Rate limiting ────────────────────────────────────────────
app.use(
    rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
        max: Number(process.env.RATE_LIMIT_MAX ?? 100),
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests, please slow down.' },
    })
);

// ── Body parsers & cookie ────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── HTTP request logging ─────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Health check (no auth, no tenant) ───────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Tenant context (applies to all /api/v1 routes) ──────────
app.use('/api/v1', tenantContext);

// ── Routes (versioned) ───────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tenants', tenantRouter); // super-admin only
app.use('/api/v1/users', userRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/offline', offlineRouter);
app.use('/api/v1/qr', qrRouter);
app.use('/api/v1/scan', scanRouter);
app.use('/api/v1/ocr', ocrRouter);

// ── 404 & Error handlers ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
