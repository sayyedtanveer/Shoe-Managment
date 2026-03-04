import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface OrderItem {
    id: string;
    quantity: number;
    total: string | null;
    variant?: {
        product?: {
            model: string;
        };
    };
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: string | null;
    createdAt: string;
    customer?: {
        name: string | null;
        phone: string | null;
    } | null;
    orderItems: OrderItem[];
}

async function fetchOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<{ data: Order[] }>('/orders');
    return data.data;
}

export function OrdersPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['orders'],
        queryFn: fetchOrders,
    });

    if (isLoading) {
        return <p className="text-neutral-300">Loading orders…</p>;
    }

    if (isError) {
        return <p className="text-red-400">Failed to load orders.</p>;
    }

    const orders = data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-1">Orders</h1>
                <p className="text-sm text-neutral-400">
                    Latest orders placed at this shop.
                </p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                    <tr className="text-left text-neutral-400">
                        <th className="px-4 py-2">Order #</th>
                        <th className="px-4 py-2">Customer</th>
                        <th className="px-4 py-2">Items</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                                No orders yet. New orders will appear here as they are created.
                            </td>
                        </tr>
                    )}
                    {orders.map((o) => {
                        const itemSummary =
                            o.orderItems.slice(0, 2).map((i) => i.variant?.product?.model).filter(Boolean) as string[];
                        return (
                            <tr key={o.id} className="border-t border-neutral-800 hover:bg-neutral-900/70">
                                <td className="px-4 py-3 text-neutral-100 font-medium">
                                    {o.orderNumber}
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                    {o.customer?.name || o.customer?.phone || (
                                        <span className="text-neutral-500">Walk-in</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                    {itemSummary.length === 0 ? (
                                        <span className="text-neutral-500">No items</span>
                                    ) : (
                                        <>
                                            {itemSummary.join(', ')}
                                            {o.orderItems.length > 2 && (
                                                <span className="text-neutral-500 text-xs"> + more</span>
                                            )}
                                        </>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-neutral-700 capitalize text-neutral-200">
                                        {o.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-teal-400 font-semibold">
                                    {o.total ? `₹${o.total}` : '—'}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

