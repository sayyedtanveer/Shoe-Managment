import { Shop, Prisma } from '@prisma/client';
import { TenantRepository } from './tenant.repository';
import { ConflictError, NotFoundError } from '@core/ApiError';

export interface CreateShopDto {
    name: string;
    slug: string;
    gstin?: string;
    address?: string;
    phone?: string;
    email?: string;
    plan?: string;
}

export class TenantService {
    private readonly repo: TenantRepository;
    constructor() { this.repo = new TenantRepository(); }

    async getAll(): Promise<Shop[]> {
        return this.repo.findAll();
    }

    async getById(id: string): Promise<Shop> {
        const shop = await this.repo.findById(id);
        if (!shop) throw new NotFoundError('Shop not found');
        return shop;
    }

    async create(dto: CreateShopDto): Promise<Shop> {
        const existing = await this.repo.findBySlug(dto.slug);
        if (existing) throw new ConflictError(`Slug "${dto.slug}" is already taken`);
        return this.repo.create(dto as Prisma.ShopCreateInput);
    }

    async update(id: string, data: Partial<CreateShopDto>): Promise<Shop> {
        await this.getById(id);
        return this.repo.update(id, data as Prisma.ShopUpdateInput);
    }

    async deactivate(id: string): Promise<Shop> {
        await this.getById(id);
        return this.repo.deactivate(id);
    }
}
