import { Customer, Prisma } from '@prisma/client';
import { CustomerRepository } from './customer.repository';
import { BadRequestError, NotFoundError } from '@core/ApiError';
import { recordAudit } from '@core/audit';

export interface CreateCustomerDto {
    phone?: string;
    name?: string;
    email?: string;
    address?: string;
    birthday?: string;
    anniversary?: string;
    preferences?: Record<string, unknown>;
}

export class CustomerService {
    private readonly repo: CustomerRepository;
    constructor() { this.repo = new CustomerRepository(); }

    list(shopId: string, search?: string) { return this.repo.findAll(shopId, search); }

    async getById(id: string, shopId: string): Promise<Customer> {
        const c = await this.repo.findById(id, shopId);
        if (!c) throw new NotFoundError('Customer not found');
        return c;
    }

    lookupByPhone(phone: string, shopId: string): Promise<Customer | null> {
        return this.repo.findByPhone(phone, shopId);
    }

    create(shopId: string, dto: CreateCustomerDto): Promise<Customer> {
        return this.repo.create({
            shop: { connect: { id: shopId } },
            ...dto,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
            anniversary: dto.anniversary ? new Date(dto.anniversary) : undefined,
            preferences: dto.preferences as Prisma.InputJsonValue,
        });
    }

    async update(id: string, shopId: string, dto: Partial<CreateCustomerDto>): Promise<Customer> {
        const before = await this.getById(id, shopId);
        const updated = await this.repo.update(id, {
            ...dto,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
            anniversary: dto.anniversary ? new Date(dto.anniversary) : undefined,
        } as Prisma.CustomerUpdateInput);

        await recordAudit({
            shopId,
            action: 'customer.update',
            entityType: 'customer',
            entityId: id,
            oldData: before,
            newData: updated,
        });

        return updated;
    }

    addLoyaltyPoints(id: string, points: number) {
        return this.repo.addLoyaltyPoints(id, points);
    }

    async redeemLoyaltyPoints(id: string, shopId: string, points: number): Promise<Customer> {
        if (!Number.isFinite(points) || points <= 0) {
            throw new BadRequestError('Points should be greater than 0');
        }
        return this.repo.redeemLoyaltyPoints(id, shopId, Math.floor(points));
    }
}

