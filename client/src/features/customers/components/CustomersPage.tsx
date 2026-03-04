import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post('/customers', {
                name: name || undefined,
                phone: phone || undefined,
                email: email || undefined,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setName('');
            setPhone('');
            setEmail('');
            setCreateError(null);
        },
        onError: (err: any) => {
            setCreateError(err?.response?.data?.message ?? 'Failed to create customer.');
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

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

            <form
                onSubmit={handleSubmit}
                className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4 space-y-3"
            >
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-teal-500 text-sm font-semibold text-neutral-900 hover:bg-teal-400 disabled:opacity-60"
                    >
                        {createMutation.isPending ? 'Saving…' : 'Add Customer'}
                    </button>
                </div>
                {createError && (
                    <p className="text-xs text-red-400 mt-1">{createError}</p>
                )}
            </form>

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

