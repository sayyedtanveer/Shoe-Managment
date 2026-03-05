import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Category {
    id: number;
    name: string;
    parentId?: number | null;
    children?: Category[];
}

async function fetchCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<{ data: Category[] }>('/inventory/categories');
    return data.data;
}

function CategoryNode({ cat, level }: { cat: Category; level: number }) {
    return (
        <>
            <tr>
                <td className="px-4 py-2 text-neutral-100">
                    <span style={{ paddingLeft: level * 16 }}>
                        {cat.name}
                    </span>
                </td>
            </tr>
            {cat.children?.map((child) => (
                <CategoryNode key={child.id} cat={child} level={level + 1} />
            ))}
        </>
    );
}

export function CategoriesPage() {
    const qc = useQueryClient();
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState<number | ''>('');

    const { data: categories = [], isLoading, isError } = useQuery({
        queryKey: ['inventory', 'categories'],
        queryFn: fetchCategories,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post('/inventory/categories', {
                name,
                parentId: parentId === '' ? undefined : Number(parentId),
            });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventory', 'categories'] });
            setName('');
            setParentId('');
        },
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    if (isLoading) return <p className="text-neutral-300">Loading categories…</p>;
    if (isError) return <p className="text-red-400">Failed to load categories.</p>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-1">Categories</h1>
                <p className="text-sm text-neutral-400">
                    Maintain hierarchical categories (e.g. Men &gt; Sports &gt; Sneakers).
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
                    <div className="w-48">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Parent category (optional)
                        </label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        >
                            <option value="">None</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-teal-500 text-sm font-semibold text-neutral-900 hover:bg-teal-400 disabled:opacity-60"
                    >
                        {createMutation.isPending ? 'Saving…' : 'Add category'}
                    </button>
                </div>
            </form>

            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                    <tr className="text-left text-neutral-400">
                        <th className="px-4 py-2">Category tree</th>
                    </tr>
                    </thead>
                    <tbody>
                    {categories.length === 0 && (
                        <tr>
                            <td className="px-4 py-6 text-center text-neutral-500">
                                No categories defined.
                            </td>
                        </tr>
                    )}
                    {categories
                        .filter((c) => !c.parentId)
                        .map((c) => (
                            <CategoryNode key={c.id} cat={c} level={0} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

