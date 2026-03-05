import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface OrderSummary {
    id: string;
    orderNumber: string;
    total: string | null;
    createdAt: string;
}

async function fetchPendingSelf(): Promise<OrderSummary[]> {
    const { data } = await apiClient.get<{ data: OrderSummary[] }>('/orders/pending/self');
    return data.data;
}

export function SalesHomePage() {
    const navigate = useNavigate();
    const { data: orders = [] } = useQuery({
        queryKey: ['sales', 'pending-self'],
        queryFn: fetchPendingSelf,
    });

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 pb-2">
                <h1 className="text-xl font-semibold mb-2">Sales</h1>
                <p className="text-sm text-gray-400">
                    Tap scan to start a new order and send it to the counter.
                </p>
            </div>
            <div className="px-4 pb-4">
                <button
                    onClick={() => navigate('/sales/scan')}
                    className="w-full py-4 rounded-2xl bg-teal-500 text-neutral-900 font-bold text-lg shadow-lg shadow-teal-500/30"
                >
                    Scan QR
                </button>
            </div>
            <div className="px-4 pb-2">
                <h2 className="text-sm font-semibold text-neutral-300 mb-2">
                    Pending orders
                </h2>
            </div>
            <div className="flex-1 overflow-auto px-4 pb-4">
                {orders.length === 0 && (
                    <p className="text-sm text-neutral-500">No pending orders yet.</p>
                )}
                <div className="space-y-2">
                    {orders.map((o) => (
                        <div
                            key={o.id}
                            className="rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-3 text-sm"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-neutral-100">
                                    {o.orderNumber}
                                </span>
                                <span className="text-teal-400 font-semibold">
                                    {o.total ? `₹${o.total}` : '—'}
                                </span>
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                                Created at {new Date(o.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

