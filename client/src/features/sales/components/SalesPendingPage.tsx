import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

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
    const { data: orders = [], isLoading, isError } = useQuery({
        queryKey: ['sales', 'pending-self'],
        queryFn: fetchPendingSelf,
    });

    if (isLoading) return <p className="text-neutral-300 p-4">Loading…</p>;
    if (isError) return <p className="text-red-400 p-4">Failed to load pending orders.</p>;

    return (
        <div className="p-4 space-y-3">
            <h1 className="text-xl font-semibold mb-2">Pending orders</h1>
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

