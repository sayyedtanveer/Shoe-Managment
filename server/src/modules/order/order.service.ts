import { Order } from '@prisma/client';
import { OrderRepository, CreatePendingOrderDto } from './order.repository';
import { NotFoundError } from '@core/ApiError';
import { recordAudit } from '@core/audit';
import { getIO } from '@realtime/socket';

export class OrderService {
    private readonly repo: OrderRepository;
    constructor() { this.repo = new OrderRepository(); }

    list(shopId: string, status?: string) { return this.repo.findAll(shopId, status); }

    async getById(id: string, shopId: string): Promise<Order> {
        const order = await this.repo.findById(id, shopId);
        if (!order) throw new NotFoundError('Order not found');
        return order;
    }

    async createPending(dto: CreatePendingOrderDto): Promise<Order> {
        const order = await this.repo.createPending(dto);
        await recordAudit({
            shopId: dto.shopId,
            action: 'order.create',
            entityType: 'order',
            entityId: order.id,
            newData: order,
        });

        const room = `shop:${dto.shopId}:counter`;
        try {
            getIO().to(room).emit('new_order', order);
        } catch {
            // ignore if socket layer not initialised
        }

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

    async listPendingForSalesman(shopId: string, salesmanId: string): Promise<Order[]> {
        return this.repo.findPendingBySalesman(shopId, salesmanId);
    }

    async listQueue(shopId: string): Promise<Order[]> {
        return this.repo.findPendingByShop(shopId);
    }

    async complete(
        shopId: string,
        orderId: string,
        cashierId: string,
        paymentMethod: string,
        amountPaid: number,
        discount?: number
    ): Promise<Order> {
        const completed = await this.repo.completeOrder(
            shopId,
            orderId,
            cashierId,
            paymentMethod,
            amountPaid,
            discount
        );
        await recordAudit({
            shopId,
            action: 'order.complete',
            entityType: 'order',
            entityId: orderId,
            newData: completed,
        });

        const room = `shop:${shopId}:counter`;
        try {
            getIO().to(room).emit('order_completed', completed);
        } catch {
            // ignore
        }

        return completed;
    }


    async assignCustomer(shopId: string, orderId: string, customerId: string): Promise<Order> {
        const updated = await this.repo.assignCustomer(shopId, orderId, customerId);
        await recordAudit({
            shopId,
            action: 'order.assignCustomer',
            entityType: 'order',
            entityId: orderId,
            newData: updated,
        });
        return updated;
    }

    async voidOrder(
        shopId: string,
        orderId: string,
        reason: string
    ): Promise<Order> {
        const voided = await this.repo.voidOrder(shopId, orderId, reason);
        await recordAudit({
            shopId,
            action: 'order.void',
            entityType: 'order',
            entityId: orderId,
            newData: voided,
        });
        return voided;
    }
}
