import { Customer, Prisma } from '@prisma/client';
import { CustomerRepository } from './customer.repository';
import { NotFoundError } from '@core/ApiError';

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

    list(shopId: string) { return this.repo.findAll(shopId); }

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
        await this.getById(id, shopId);
        return this.repo.update(id, {
            ...dto,
            birthday: dto.birthday ? new Date(dto.birthday) : undefined,
            anniversary: dto.anniversary ? new Date(dto.anniversary) : undefined,
        } as Prisma.CustomerUpdateInput);
    }

    addLoyaltyPoints(id: string, points: number) {
        return this.repo.addLoyaltyPoints(id, points);
    }
}
