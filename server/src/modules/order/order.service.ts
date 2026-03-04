import { Order } from '@prisma/client';
import { OrderRepository, CreateOrderDto } from './order.repository';
import { NotFoundError } from '@core/ApiError';

export class OrderService {
    private readonly repo: OrderRepository;
    constructor() { this.repo = new OrderRepository(); }

    list(shopId: string, status?: string) { return this.repo.findAll(shopId, status); }

    async getById(id: string, shopId: string): Promise<Order> {
        const order = await this.repo.findById(id, shopId);
        if (!order) throw new NotFoundError('Order not found');
        return order;
    }

    create(dto: CreateOrderDto): Promise<Order> { return this.repo.createWithItems(dto); }

    async updateStatus(id: string, shopId: string, status: string): Promise<Order> {
        await this.getById(id, shopId);
        return this.repo.updateStatus(id, shopId, status);
    }
}
