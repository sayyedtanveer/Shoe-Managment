import { Order } from '@prisma/client';
import { OrderRepository, CreateOrderDto } from './order.repository';
import { NotFoundError } from '@core/ApiError';
import { recordAudit } from '@core/audit';

export class OrderService {
    private readonly repo: OrderRepository;
    constructor() { this.repo = new OrderRepository(); }

    list(shopId: string, status?: string) { return this.repo.findAll(shopId, status); }

    async getById(id: string, shopId: string): Promise<Order> {
        const order = await this.repo.findById(id, shopId);
        if (!order) throw new NotFoundError('Order not found');
        return order;
    }

    async create(dto: CreateOrderDto): Promise<Order> {
        const order = await this.repo.createWithItems(dto);
        await recordAudit({
            shopId: dto.shopId,
            action: 'order.create',
            entityType: 'order',
            entityId: order.id,
            newData: order,
        });
        return order;
    }

    async updateStatus(id: string, shopId: string, status: string): Promise<Order> {
        const before = await this.getById(id, shopId);
        const updated = await this.repo.updateStatus(id, shopId, status);
        await recordAudit({
            shopId,
            action: 'order.updateStatus',
            entityType: 'order',
            entityId: id,
            oldData: before,
            newData: updated,
        });
        return updated;
    }
}
