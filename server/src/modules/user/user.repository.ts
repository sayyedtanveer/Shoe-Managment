import prisma from '@infrastructure/database/prisma';
import { User, Prisma } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash' | 'pinCode'>;

export class UserRepository {
    private select = {
        id: true,
        shopId: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        passwordHash: false,
        pinCode: false,
    };

    async findAllByShop(shopId: string): Promise<SafeUser[]> {
        return prisma.user.findMany({
            where: { shopId },
            select: this.select,
            orderBy: { createdAt: 'desc' },
        }) as Promise<SafeUser[]>;
    }

    async findById(id: string, shopId: string): Promise<SafeUser | null> {
        return prisma.user.findFirst({
            where: { id, shopId },
            select: this.select,
        }) as Promise<SafeUser | null>;
    }

    async existsUsername(shopId: string, username: string): Promise<boolean> {
        const count = await prisma.user.count({ where: { shopId, username } });
        return count > 0;
    }

    async create(data: Prisma.UserCreateInput): Promise<SafeUser> {
        return prisma.user.create({ data, select: this.select }) as Promise<SafeUser>;
    }

    async update(id: string, shopId: string, data: Prisma.UserUpdateInput): Promise<SafeUser> {
        return prisma.user.update({
            where: { id },
            data: { ...data },
            select: this.select,
        }) as Promise<SafeUser>;
    }

    async toggleActive(id: string, shopId: string, isActive: boolean): Promise<SafeUser> {
        return prisma.user.update({
            where: { id },
            data: { isActive },
            select: this.select,
        }) as Promise<SafeUser>;
    }
}
