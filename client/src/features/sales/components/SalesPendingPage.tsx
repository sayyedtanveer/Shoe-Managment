import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { salesDb, PendingOrder } from '@/lib/salesDb';

interface Order {
    id: string;
    orderNumber: string;
    total: string | null;
    createdAt: string;
}

async function fetchPendingSelf(): Promise<Order[]> {
    const { data } = await apiClient.get<{ data: Order[] }>('/orders/pending/self');
    return data.data;
}

export function SalesPendingPage() {
    const [unsynced, setUnsynced] = useState<PendingOrder[]>([]);
    const { data: orders = [], isLoading, isError } = useQuery({
        queryKey: ['sales', 'pending-self'],
        queryFn: fetchPendingSelf,
    });

    useEffect(() => {
        let mounted = true;
        async function load() {
            const rows = await salesDb.pendingOrders.filter(p => p.synced === false).toArray();
            if (mounted) setUnsynced(rows);
        }
        void load();
        const timer = window.setInterval(() => { void load(); }, 10000);
        return () => { mounted = false; window.clearInterval(timer); };
    }, []);

    if (isLoading) return <p className="text-neutral-300 p-4">Loading…</p>;
    if (isError) return <p className="text-red-400 p-4">Failed to load pending orders.</p>;

    return (
        <div className="p-4 space-y-3">
            <h1 className="text-xl font-semibold mb-2">Pending orders</h1>
            {unsynced.length > 0 && (
                <div className="rounded-xl border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                    {unsynced.length} order{unsynced.length > 1 ? 's' : ''} not synced. They will be sent when online.
                </div>
            )}
            {orders.length === 0 && (
                <p className="text-sm text-neutral-500">No pending orders.</p>
            )}
            <div className="space-y-2">
                {orders.map((o) => (
                    <div
                        key={o.id}
                        className="rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-3 text-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-neutral-100">
                                {o.orderNumber}
                            </div>
                            <div className="text-teal-400 font-semibold">
                                {o.total ? `₹${o.total}` : '—'}
                            </div>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                            Created at {new Date(o.createdAt).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

