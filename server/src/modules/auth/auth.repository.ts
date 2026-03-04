import prisma from '@infrastructure/database/prisma';
import { User } from '@prisma/client';

export class AuthRepository {
    /**
     * Find a user by username within a shop.
     */
    async findByUsername(shopId: string, username: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: { shopId, username, isActive: true },
        });
    }

    /**
     * Find a user by id.
     */
    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    /**
     * Update the last login timestamp.
     */
    async recordLogin(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { lastLogin: new Date() },
        });
    }
}
