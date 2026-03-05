import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Brand {
    id: number;
    name: string;
    gstRate: number;
}

async function fetchBrands(): Promise<Brand[]> {
    const { data } = await apiClient.get<{ data: Brand[] }>('/inventory/brands');
    return data.data;
}

export function BrandsPage() {
    const qc = useQueryClient();
    const [name, setName] = useState('');
    const [gstRate, setGstRate] = useState<number | ''>('');
    const [error, setError] = useState<string | null>(null);

    const { data: brands = [], isLoading, isError } = useQuery({
        queryKey: ['inventory', 'brands'],
        queryFn: fetchBrands,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post('/inventory/brands', {
                name,
                gstRate: gstRate === '' ? undefined : Number(gstRate),
            });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventory', 'brands'] });
            setName('');
            setGstRate('');
            setError(null);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to create brand');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.delete(`/inventory/brands/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory', 'brands'] }),
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    if (isLoading) return <p className="text-neutral-300">Loading brands…</p>;
    if (isError) return <p className="text-red-400">Failed to load brands.</p>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-1">Brands</h1>
                <p className="text-sm text-neutral-400">
                    Manage footwear brands and default GST rates for this shop.
                </p>
            </div>

            <form
                onSubmit={onSubmit}
                className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4 space-y-3"
            >
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                            required
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            GST %
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={gstRate}
                            onChange={(e) => setGstRate(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-teal-500 text-sm font-semibold text-neutral-900 hover:bg-teal-400 disabled:opacity-60"
                    >
                        {createMutation.isPending ? 'Saving…' : 'Add brand'}
                    </button>
                </div>
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </form>

            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                    <tr className="text-left text-neutral-400">
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">GST %</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {brands.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                                No brands yet.
                            </td>
                        </tr>
                    )}
                    {brands.map((b) => (
                        <tr key={b.id} className="border-t border-neutral-800 hover:bg-neutral-900/70">
                            <td className="px-4 py-3 text-neutral-100">{b.name}</td>
                            <td className="px-4 py-3 text-neutral-300">{b.gstRate}%</td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => deleteMutation.mutate(b.id)}
                                    className="text-xs font-medium px-3 py-1 rounded-md border border-red-500/60 text-red-400 hover:bg-red-500/10"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

