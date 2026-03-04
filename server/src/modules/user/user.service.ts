import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { UserRepository, SafeUser } from './user.repository';
import { ConflictError, NotFoundError } from '@core/ApiError';
import { recordAudit } from '@core/audit';

export interface CreateUserDto {
    username: string;
    password: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role: string;
    pinCode?: string;
}

export interface UpdateUserDto {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
}

export class UserService {
    private readonly repo: UserRepository;
    constructor() { this.repo = new UserRepository(); }

    async list(shopId: string): Promise<SafeUser[]> {
        return this.repo.findAllByShop(shopId);
    }

    async getById(id: string, shopId: string): Promise<SafeUser> {
        const user = await this.repo.findById(id, shopId);
        if (!user) throw new NotFoundError('User not found');
        return user;
    }

    async create(shopId: string, dto: CreateUserDto): Promise<SafeUser> {
        const exists = await this.repo.existsUsername(shopId, dto.username);
        if (exists) throw new ConflictError(`Username "${dto.username}" already exists in this shop`);

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const data: Prisma.UserCreateInput = {
            shop: { connect: { id: shopId } },
            username: dto.username,
            passwordHash,
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone,
            role: dto.role,
            pinCode: dto.pinCode,
        };
        const created = await this.repo.create(data);

        await recordAudit({
            shopId,
            userId: undefined,
            action: 'user.create',
            entityType: 'user',
            entityId: created.id,
            newData: created as unknown as Prisma.JsonValue,
        });

        return created;
    }

    async update(id: string, shopId: string, dto: UpdateUserDto): Promise<SafeUser> {
        const before = await this.getById(id, shopId);
        const updated = await this.repo.update(id, shopId, dto as Prisma.UserUpdateInput);

        await recordAudit({
            shopId,
            userId: undefined,
            action: 'user.update',
            entityType: 'user',
            entityId: id,
            oldData: before as unknown as Prisma.JsonValue,
            newData: updated as unknown as Prisma.JsonValue,
        });

        return updated;
    }

    async toggleActive(id: string, shopId: string, isActive: boolean): Promise<SafeUser> {
        const before = await this.getById(id, shopId);
        const updated = await this.repo.toggleActive(id, shopId, isActive);

        await recordAudit({
            shopId,
            userId: undefined,
            action: isActive ? 'user.activate' : 'user.deactivate',
            entityType: 'user',
            entityId: id,
            oldData: before as unknown as Prisma.JsonValue,
            newData: updated as unknown as Prisma.JsonValue,
        });

        return updated;
    }
}
