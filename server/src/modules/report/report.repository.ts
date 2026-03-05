import prisma from '@infrastructure/database/prisma';
import { Prisma } from '@prisma/client';

export class ReportRepository {
    async sales(shopId: string, from: Date, to: Date, groupBy: 'day' | 'product' | 'salesman') {
        if (groupBy === 'day') {
            return prisma.$queryRaw<Array<{ label: string; orders: bigint; total: Prisma.Decimal }>>`
                SELECT
                    to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD') AS label,
                    COUNT(*)::bigint AS orders,
                    COALESCE(SUM(o.total), 0) AS total
                FROM orders o
                WHERE o.shop_id = ${shopId}::uuid
                  AND o.status = 'completed'
                  AND o.created_at BETWEEN ${from} AND ${to}
                GROUP BY date_trunc('day', o.created_at)
                ORDER BY date_trunc('day', o.created_at)
            `;
        }

        if (groupBy === 'product') {
            return prisma.$queryRaw<Array<{ label: string; quantity: bigint; total: Prisma.Decimal }>>`
                SELECT
                    p.model AS label,
                    COALESCE(SUM(oi.quantity), 0)::bigint AS quantity,
                    COALESCE(SUM(oi.total), 0) AS total
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                JOIN product_variants pv ON pv.id = oi.variant_id
                JOIN products p ON p.id = pv.product_id
                WHERE o.shop_id = ${shopId}::uuid
                  AND o.status = 'completed'
                  AND o.created_at BETWEEN ${from} AND ${to}
                GROUP BY p.model
                ORDER BY total DESC
            `;
        }

        return prisma.$queryRaw<Array<{ label: string; orders: bigint; total: Prisma.Decimal }>>`
            SELECT
                COALESCE(u.full_name, u.username, 'Unknown') AS label,
                COUNT(*)::bigint AS orders,
                COALESCE(SUM(o.total), 0) AS total
            FROM orders o
            LEFT JOIN users u ON u.id = o.salesman_id
            WHERE o.shop_id = ${shopId}::uuid
              AND o.status = 'completed'
              AND o.created_at BETWEEN ${from} AND ${to}
            GROUP BY COALESCE(u.full_name, u.username, 'Unknown')
            ORDER BY total DESC
        `;
    }

    async inventory(shopId: string) {
        const items = await prisma.$queryRaw<Array<{
            variantId: string;
            product: string;
            sku: string;
            quantity: number;
            sellingPrice: Prisma.Decimal;
            value: Prisma.Decimal;
            lowStock: boolean;
        }>>`
            SELECT
                pv.id AS "variantId",
                p.model AS product,
                CONCAT(COALESCE(p.model, ''), '-', COALESCE(pv.color, ''), '-', COALESCE(CAST(pv.size AS text), '')) AS sku,
                pv.quantity AS quantity,
                COALESCE(p.selling_price, 0) AS "sellingPrice",
                (pv.quantity * COALESCE(p.selling_price, 0)) AS value,
                (pv.quantity <= 5) AS "lowStock"
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            WHERE pv.shop_id = ${shopId}::uuid
            ORDER BY pv.quantity ASC
        `;

        const totals = await prisma.$queryRaw<Array<{ stockValue: Prisma.Decimal; lowStockCount: bigint }>>`
            SELECT
                COALESCE(SUM(pv.quantity * COALESCE(p.selling_price, 0)), 0) AS "stockValue",
                COALESCE(SUM(CASE WHEN pv.quantity <= 5 THEN 1 ELSE 0 END), 0)::bigint AS "lowStockCount"
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            WHERE pv.shop_id = ${shopId}::uuid
        `;

        return {
            summary: totals[0],
            items,
        };
    }

    async gst(shopId: string, monthStart: Date, monthEnd: Date) {
        const rows = await prisma.$queryRaw<Array<{ taxableValue: Prisma.Decimal; gstAmount: Prisma.Decimal; totalSales: Prisma.Decimal; invoices: bigint }>>`
            SELECT
                COALESCE(SUM(o.subtotal - o.discount), 0) AS "taxableValue",
                COALESCE(SUM(o.tax), 0) AS "gstAmount",
                COALESCE(SUM(o.total), 0) AS "totalSales",
                COUNT(*)::bigint AS invoices
            FROM orders o
            WHERE o.shop_id = ${shopId}::uuid
              AND o.status = 'completed'
              AND o.completed_at BETWEEN ${monthStart} AND ${monthEnd}
        `;
        return rows[0];
    }
}
