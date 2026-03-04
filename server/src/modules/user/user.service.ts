import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { UserRepository, SafeUser } from './user.repository';
import { ConflictError, NotFoundError } from '@core/ApiError';

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
        return this.repo.create(data);
    }

    async update(id: string, shopId: string, dto: UpdateUserDto): Promise<SafeUser> {
        await this.getById(id, shopId);
        return this.repo.update(id, shopId, dto as Prisma.UserUpdateInput);
    }

    async toggleActive(id: string, shopId: string, isActive: boolean): Promise<SafeUser> {
        await this.getById(id, shopId);
        return this.repo.toggleActive(id, shopId, isActive);
    }
}
