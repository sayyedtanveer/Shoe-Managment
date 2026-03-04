import prisma from '@infrastructure/database/prisma';
import { Customer, Prisma } from '@prisma/client';
import { NotFoundError } from '@core/ApiError';

export class CustomerRepository {
    findAll(shopId: string): Promise<Customer[]> {
        return prisma.customer.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
    }

    findById(id: string, shopId: string): Promise<Customer | null> {
        return prisma.customer.findFirst({
            where: { id, shopId },
            include: { orders: { take: 5, orderBy: { createdAt: 'desc' } } },
        } as Prisma.CustomerFindFirstArgs);
    }

    findByPhone(phone: string, shopId: string): Promise<Customer | null> {
        return prisma.customer.findFirst({ where: { phone, shopId } });
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
}
