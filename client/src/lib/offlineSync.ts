import { apiClient } from '@/lib/apiClient';
import { salesDb, PendingOrder } from '@/lib/salesDb';

function keyFor(order: PendingOrder) {
    return `po:${order.shopId}:${order.id}:${order.createdAt}`;
}

async function syncOnce() {
    if (!navigator.onLine) return;
    const unsynced = await salesDb.pendingOrders.where('synced').equals(false).toArray();
    if (!unsynced.length) return;
    for (const op of unsynced) {
        try {
            const headers = { 'Idempotency-Key': keyFor(op) };
            const payload = { items: op.items };
            await apiClient.post('/orders', payload, { headers });
            await salesDb.pendingOrders.update(op.id!, { synced: true });
            await salesDb.pendingOrders.delete(op.id!);
        } catch {
        }
    }
}

let started = false;
let intervalId: number | null = null;

export function startOfflineSync() {
    if (started) return;
    started = true;
    window.addEventListener('online', () => { void syncOnce(); });
    void syncOnce();
    intervalId = window.setInterval(() => { void syncOnce(); }, 30000);
}

export async function getUnsyncedCount(): Promise<number> {
    return salesDb.pendingOrders.where('synced').equals(false).count();
}
