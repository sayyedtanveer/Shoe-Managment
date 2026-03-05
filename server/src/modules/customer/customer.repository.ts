import prisma from '@infrastructure/database/prisma';
import { Customer, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '@core/ApiError';

export class CustomerRepository {
    findAll(shopId: string, search?: string): Promise<Customer[]> {
        return prisma.customer.findMany({
            where: {
                shopId,
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { phone: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findById(id: string, shopId: string): Promise<Customer | null> {
        return prisma.customer.findFirst({
            where: { id, shopId },
            include: {
                orders: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        orderItems: {
                            include: {
                                variant: {
                                    include: { product: true },
                                },
                            },
                        },
                    },
                },
            },
        } as Prisma.CustomerFindFirstArgs);
    }

    findByPhone(phone: string, shopId: string): Promise<Customer | null> {
        return prisma.customer.findFirst({ where: { phone: { contains: phone }, shopId } });
    }

    create(data: Prisma.CustomerCreateInput): Promise<Customer> {
        return prisma.customer.create({ data });
    }

    update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
        return prisma.customer.update({ where: { id }, data });
    }

    addLoyaltyPoints(id: string, points: number): Promise<Customer> {
        return prisma.customer.update({
            where: { id },
            data: { loyaltyPoints: { increment: points } },
        });
    }

    async redeemLoyaltyPoints(id: string, shopId: string, points: number): Promise<Customer> {
        const customer = await prisma.customer.findFirst({ where: { id, shopId } });
        if (!customer) throw new NotFoundError('Customer not found');
        if (customer.loyaltyPoints < points) {
            throw new BadRequestError('Insufficient loyalty points');
        }

        return prisma.customer.update({
            where: { id },
            data: { loyaltyPoints: { decrement: points } },
        });
    }
}
