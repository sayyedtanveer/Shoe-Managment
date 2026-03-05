import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Location {
    id: number;
    name: string;
    isActive: boolean;
}

async function fetchLocations(): Promise<Location[]> {
    const { data } = await apiClient.get<{ data: Location[] }>('/inventory/locations');
    return data.data;
}

export function LocationsPage() {
    const qc = useQueryClient();
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(true);

    const { data: locations = [], isLoading, isError } = useQuery({
        queryKey: ['inventory', 'locations'],
        queryFn: fetchLocations,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post('/inventory/locations', {
                name,
                isActive,
            });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventory', 'locations'] });
            setName('');
            setIsActive(true);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (loc: Location) =>
            apiClient.put(`/inventory/locations/${loc.id}`, { isActive: !loc.isActive }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory', 'locations'] }),
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    if (isLoading) return <p className="text-neutral-300">Loading locations…</p>;
    if (isError) return <p className="text-red-400">Failed to load locations.</p>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-1">Locations</h1>
                <p className="text-sm text-neutral-400">
                    Manage storage locations (racks, shelves, stockrooms) for variants.
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
                    <label className="inline-flex items-center gap-2 text-xs text-neutral-300">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="rounded border-neutral-600 bg-neutral-900 text-teal-500 focus:ring-teal-500/60"
                        />
                        Active
                    </label>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-teal-500 text-sm font-semibold text-neutral-900 hover:bg-teal-400 disabled:opacity-60"
                    >
                        {createMutation.isPending ? 'Saving…' : 'Add location'}
                    </button>
                </div>
            </form>

            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                    <tr className="text-left text-neutral-400">
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {locations.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                                No locations defined.
                            </td>
                        </tr>
                    )}
                    {locations.map((loc) => (
                        <tr key={loc.id} className="border-t border-neutral-800 hover:bg-neutral-900/70">
                            <td className="px-4 py-3 text-neutral-100">{loc.name}</td>
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border ${
                                        loc.isActive
                                            ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                                            : 'border-neutral-600 text-neutral-300 bg-neutral-800'
                                    }`}
                                >
                                    {loc.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => toggleMutation.mutate(loc)}
                                    className="text-xs font-medium px-3 py-1 rounded-md border border-neutral-600 text-neutral-100 hover:bg-neutral-800"
                                >
                                    {loc.isActive ? 'Deactivate' : 'Activate'}
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

