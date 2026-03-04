import prisma from '@infrastructure/database/prisma';
import { Shop, Prisma } from '@prisma/client';

export class TenantRepository {
    async findAll(): Promise<Shop[]> {
        return prisma.shop.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async findById(id: string): Promise<Shop | null> {
        return prisma.shop.findUnique({ where: { id } });
    }

    async findBySlug(slug: string): Promise<Shop | null> {
        return prisma.shop.findUnique({ where: { slug } });
    }

    async create(data: Prisma.ShopCreateInput): Promise<Shop> {
        return prisma.shop.create({ data });
    }

    async update(id: string, data: Prisma.ShopUpdateInput): Promise<Shop> {
        return prisma.shop.update({ where: { id }, data });
    }

    async deactivate(id: string): Promise<Shop> {
        return prisma.shop.update({ where: { id }, data: { isActive: false } });
    }
}
