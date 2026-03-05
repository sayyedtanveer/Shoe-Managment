import prisma from '@infrastructure/database/prisma';
import { Order, OrderItem, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '@core/ApiError';

export interface CreateOrderDto {
    shopId: string;
    salesmanId?: string;
    cashierId?: string;
    customerId?: string;
    paymentMethod: string;
    paymentDetails?: Record<string, unknown>;
    discount?: number;
    items: Array<{
        variantId: string;
        quantity: number;
        discount?: number;
    }>;
}

export interface CreatePendingOrderDto {
    shopId: string;
    salesmanId?: string;
    customerId?: string;
    items: Array<{
        variantId: string;
        quantity: number;
    }>;
}

export class OrderRepository {
    async findAll(shopId: string, status?: string): Promise<Order[]> {
        return prisma.order.findMany({
            where: { shopId, ...(status && { status }) },
            include: { orderItems: { include: { variant: { include: { product: true } } } }, customer: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string, shopId: string): Promise<Order | null> {
        return prisma.order.findFirst({
            where: { id, shopId },
            include: {
                orderItems: { include: { variant: { include: { product: { include: { brand: true } } } } } },
                customer: true,
                salesman: { select: { id: true, fullName: true, username: true } },
                cashier: { select: { id: true, fullName: true, username: true } },
            },
        });
    }

    async findPendingBySalesman(shopId: string, salesmanId: string): Promise<Order[]> {
        return prisma.order.findMany({
            where: { shopId, salesmanId, status: 'pending' },
            include: {
                orderItems: { include: { variant: { include: { product: true } } } },
                customer: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPendingByShop(shopId: string): Promise<Order[]> {
        return prisma.order.findMany({
            where: { shopId, status: 'pending' },
            include: {
                orderItems: { include: { variant: { include: { product: true } } } },
                customer: true,
                salesman: { select: { id: true, fullName: true, username: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Create an order with items in a Prisma transaction.
     * Deducts stock atomically.
     */
    async createWithItems(dto: CreateOrderDto): Promise<Order> {
        return prisma.$transaction(async (tx) => {
            // 1. Generate sequential order number for the shop
            const count = await tx.order.count({ where: { shopId: dto.shopId } });
            const orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;

            // 2. Resolve variant prices and validate stock
            let subtotal = 0;
            const resolvedItems: Array<{
                variantId: string; qty: number; price: number; discount: number; lineTotal: number;
            }> = [];

            for (const item of dto.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { product: true },
                });

                if (!variant) throw new NotFoundError(`Variant ${item.variantId} not found`);
                if (variant.shopId !== dto.shopId) throw new BadRequestError('Variant does not belong to this shop');
                if (variant.quantity < item.quantity) {
                    throw new BadRequestError(
                        `Insufficient stock for variant ${item.variantId} (available: ${variant.quantity})`
                    );
                }

                const price = Number(variant.product.sellingPrice ?? 0);
                const disc = item.discount ?? 0;
                const lineTotal = (price - disc) * item.quantity;
                subtotal += lineTotal;
                resolvedItems.push({ variantId: item.variantId, qty: item.quantity, price, discount: disc, lineTotal });

                // Deduct stock
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: { quantity: { decrement: item.quantity } },
                });
            }

            const discount = dto.discount ?? 0;
            const tax = Math.round(subtotal * 0.05 * 100) / 100; // simplified 5% GST
            const total = subtotal - discount + tax;

            // 3. Create order + items
            const order = await tx.order.create({
                data: {
                    shopId: dto.shopId,
                    orderNumber,
                    salesmanId: dto.salesmanId,
                    cashierId: dto.cashierId,
                    customerId: dto.customerId,
                    status: 'completed',
                    subtotal,
                    discount,
                    tax,
                    total,
                    paymentMethod: dto.paymentMethod,
                    paymentDetails: dto.paymentDetails as Prisma.InputJsonValue,
                    completedAt: new Date(),
                    orderItems: {
                        create: resolvedItems.map((i) => ({
                            shopId: dto.shopId,
                            variantId: i.variantId,
                            quantity: i.qty,
                            priceAtTime: i.price,
                            discount: i.discount,
                            total: i.lineTotal,
                        })),
                    },
                },
                include: { orderItems: true },
            });

            // 4. Update customer total purchases
            if (dto.customerId) {
                await tx.customer.update({
                    where: { id: dto.customerId },
                    data: { totalPurchases: { increment: total } },
                });
            }

            return order;
        });
    }

    /**
     * Create a pending order without touching stock or payment fields.
     */
    async createPending(dto: CreatePendingOrderDto): Promise<Order> {
        return prisma.$transaction(async (tx) => {
            const count = await tx.order.count({ where: { shopId: dto.shopId } });
            const orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;

            let subtotal = 0;
            const resolvedItems: Array<{
                variantId: string;
                qty: number;
                price: number;
                lineTotal: number;
            }> = [];

            for (const item of dto.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { product: true },
                });

                if (!variant) throw new NotFoundError(`Variant ${item.variantId} not found`);
                if (variant.shopId !== dto.shopId) throw new BadRequestError('Variant does not belong to this shop');

                const price = Number(variant.product.sellingPrice ?? 0);
                const lineTotal = price * item.quantity;
                subtotal += lineTotal;
                resolvedItems.push({ variantId: item.variantId, qty: item.quantity, price, lineTotal });
            }

            const tax = Math.round(subtotal * 0.05 * 100) / 100;
            const total = subtotal + tax;

            const order = await tx.order.create({
                data: {
                    shopId: dto.shopId,
                    orderNumber,
                    salesmanId: dto.salesmanId,
                    customerId: dto.customerId,
                    status: 'pending',
                    subtotal,
                    discount: 0,
                    tax,
                    total,
                    orderItems: {
                        create: resolvedItems.map((i) => ({
                            shopId: dto.shopId,
                            variantId: i.variantId,
                            quantity: i.qty,
                            priceAtTime: i.price,
                            discount: 0,
                            total: i.lineTotal,
                        })),
                    },
                },
                include: { orderItems: true, customer: true, salesman: true },
            });

            return order;
        });
    }

    async updateStatus(id: string, shopId: string, status: string): Promise<Order> {
        return prisma.order.update({ where: { id, shopId }, data: { status } });
    }

    async completeOrder(
        shopId: string,
        orderId: string,
        cashierId: string,
        paymentMethod: string,
        amountPaid: number,
        discount?: number
    ): Promise<Order> {
        return prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: orderId, shopId },
                include: { orderItems: true },
            });
            if (!order) throw new NotFoundError('Order not found');
            if (order.status !== 'pending') {
                throw new BadRequestError('Only pending orders can be completed');
            }

            for (const item of order.orderItems) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId! },
                });
                if (!variant) throw new NotFoundError(`Variant ${item.variantId} not found`);
                if (variant.shopId !== shopId) {
                    throw new BadRequestError('Variant does not belong to this shop');
                }
                if (variant.quantity < item.quantity) {
                    throw new BadRequestError(
                        `Insufficient stock for variant ${item.variantId} (available: ${variant.quantity})`
                    );
                }
                await tx.productVariant.update({
                    where: { id: item.variantId! },
                    data: { quantity: { decrement: item.quantity } },
                });
            }

            const effectiveDiscount = discount ?? order.discount;
            const total =
                (order.subtotal ?? 0) - (effectiveDiscount ?? 0) + (order.tax ?? 0);

            const updated = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'completed',
                    cashierId,
                    paymentMethod,
                    paymentDetails: { amountPaid } as Prisma.InputJsonValue,
                    discount: effectiveDiscount,
                    total,
                    completedAt: new Date(),
                },
                include: {
                    orderItems: { include: { variant: { include: { product: true } } } },
                    customer: true,
                    salesman: { select: { id: true, fullName: true, username: true } },
                    cashier: { select: { id: true, fullName: true, username: true } },
                },
            });

            if (updated.customerId) {
                await tx.customer.update({
                    where: { id: updated.customerId },
                    data: { totalPurchases: { increment: total } },
                });
            }

            return updated;
        });
    }

    async voidOrder(
        shopId: string,
        orderId: string,
        reason: string
    ): Promise<Order> {
        const order = await prisma.order.findFirst({ where: { id: orderId, shopId } });
        if (!order) throw new NotFoundError('Order not found');
        if (order.status === 'completed') {
            throw new BadRequestError('Completed orders cannot be voided');
        }
        return prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'cancelled',
                paymentDetails: {
                    ...(order.paymentDetails as Prisma.InputJsonValue),
                    voidReason: reason,
                } as Prisma.InputJsonValue,
            },
        });
    }
}
