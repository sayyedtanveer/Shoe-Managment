import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Customer {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    totalPurchases: string;
    loyaltyPoints: number;
    createdAt: string;
}

async function fetchCustomers(): Promise<Customer[]> {
    const { data } = await apiClient.get<{ data: Customer[] }>('/customers');
    return data.data;
}

export function CustomersPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
    });

    if (isLoading) {
        return <p className="text-neutral-300">Loading customers…</p>;
    }

    if (isError) {
        return <p className="text-red-400">Failed to load customers.</p>;
    }

    const customers = data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-1">Customers</h1>
                <p className="text-sm text-neutral-400">
                    Recent customers and loyalty information for this shop.
                </p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                    <tr className="text-left text-neutral-400">
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Phone</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2 text-right">Total Purchases</th>
                        <th className="px-4 py-2 text-right">Loyalty Points</th>
                    </tr>
                    </thead>
                    <tbody>
                    {customers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                                No customers yet. Customers will appear here after their first order.
                            </td>
                        </tr>
                    )}
                    {customers.map((c) => (
                        <tr key={c.id} className="border-t border-neutral-800 hover:bg-neutral-900/70">
                            <td className="px-4 py-3 text-neutral-100">
                                {c.name || <span className="text-neutral-500">Unnamed</span>}
                            </td>
                            <td className="px-4 py-3 text-neutral-300">
                                {c.phone || <span className="text-neutral-500">—</span>}
                            </td>
                            <td className="px-4 py-3 text-neutral-300">
                                {c.email || <span className="text-neutral-500">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-teal-400 font-semibold">
                                ₹{c.totalPurchases}
                            </td>
                            <td className="px-4 py-3 text-right text-amber-300 font-semibold">
                                {c.loyaltyPoints}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

