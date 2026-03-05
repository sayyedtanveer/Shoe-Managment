import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';

export function CustomerDetailPage() {
    const { id = '' } = useParams();
    const { data, isLoading } = useQuery({
        queryKey: ['customers', id],
        queryFn: async () => (await apiClient.get(`/customers/${id}`)).data.data,
        enabled: Boolean(id),
    });

    if (isLoading) return <p>Loading...</p>;
    if (!data) return <p>Customer not found.</p>;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">{data.name ?? 'Customer'}</h1>
            <p>Phone: {data.phone ?? '—'} · Email: {data.email ?? '—'}</p>
            <p>Total purchases: ₹{Number(data.totalPurchases ?? 0).toFixed(2)} · Points: {data.loyaltyPoints}</p>
            <div className="rounded-lg border border-neutral-700 p-3">
                <h2 className="font-semibold mb-2">Purchase history</h2>
                <table className="w-full text-sm"><thead><tr className="text-left text-gray-400"><th>Order</th><th>Date</th><th>Total</th></tr></thead><tbody>{(data.orders ?? []).map((o: any) => <tr key={o.id} className="border-t border-neutral-800"><td>{o.orderNumber}</td><td>{new Date(o.createdAt).toLocaleDateString()}</td><td>₹{Number(o.total ?? 0).toFixed(2)}</td></tr>)}</tbody></table>
            </div>
        </div>
    );
}
