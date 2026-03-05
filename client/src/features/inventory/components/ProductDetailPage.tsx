import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ProductVariantsQrPanel } from './ProductVariantsQrPanel';

interface Location {
    id: number;
    name: string;
}

interface Variant {
    id: string;
    size: number | null;
    color: string | null;
    quantity: number;
    location?: Location | null;
}

interface Product {
    id: string;
    model: string;
    description?: string | null;
    brand?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    sellingPrice?: string | null;
    mrp?: string | null;
    variants: Variant[];
}

async function fetchProduct(id: string): Promise<Product> {
    const { data } = await apiClient.get<{ data: Product }>(`/inventory/products/${id}`);
    return data.data;
}

async function fetchLocations(): Promise<Location[]> {
    const { data } = await apiClient.get<{ data: Location[] }>('/inventory/locations');
    return data.data;
}

export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [bulkRows, setBulkRows] = useState<
        { size?: string; color?: string; quantity?: number; locationId?: number }[]
    >([{ size: '', color: '', quantity: 0, locationId: undefined }]);

    if (!id) return <p className="text-red-400">Missing product id.</p>;

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ['inventory', 'product', id],
        queryFn: () => fetchProduct(id),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['inventory', 'locations'],
        queryFn: fetchLocations,
    });

    const createVariantsMutation = useMutation({
        mutationFn: async () => {
            const variants = bulkRows
                .filter((r) => r.size || r.color)
                .map((r) => ({
                    size: r.size ? Number(r.size) : undefined,
                    color: r.color || undefined,
                    quantity: r.quantity ?? 0,
                    locationId: r.locationId,
                }));
            if (variants.length === 0) return;
            const { data } = await apiClient.post(`/inventory/products/${id}/variants`, {
                variants,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'product', id] });
            setBulkRows([{ size: '', color: '', quantity: 0, locationId: undefined }]);
        },
    });

    if (isLoading) return <p className="text-neutral-300">Loading product…</p>;
    if (isError || !product) return <p className="text-red-400">Failed to load product.</p>;

    const selectedVariantIds = product.variants.map((v) => v.id);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{product.model}</h1>
                    <p className="text-sm text-neutral-400">
                        {product.brand?.name && <span>{product.brand.name} · </span>}
                        {product.category?.name}
                    </p>
                </div>
                {product.sellingPrice && (
                    <div className="text-right">
                        <p className="text-sm text-neutral-400">Selling price</p>
                        <p className="text-xl font-semibold text-teal-400">₹{product.sellingPrice}</p>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
                        Existing variants
                    </h2>
                    <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-neutral-900 border-b border-neutral-700">
                            <tr className="text-left text-neutral-400">
                                <th className="px-4 py-2">Size</th>
                                <th className="px-4 py-2">Color</th>
                                <th className="px-4 py-2">Location</th>
                                <th className="px-4 py-2 text-right">Qty</th>
                            </tr>
                            </thead>
                            <tbody>
                            {product.variants.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                                        No variants defined yet.
                                    </td>
                                </tr>
                            )}
                            {product.variants.map((v) => (
                                <tr
                                    key={v.id}
                                    className="border-t border-neutral-800 hover:bg-neutral-900/70"
                                >
                                    <td className="px-4 py-2 text-neutral-100">{v.size ?? '—'}</td>
                                    <td className="px-4 py-2 text-neutral-300">{v.color ?? '—'}</td>
                                    <td className="px-4 py-2 text-neutral-300">
                                        {v.location?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-neutral-100 font-semibold">
                                        {v.quantity}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
                            QR codes
                        </h2>
                        <ProductVariantsQrPanel variantIds={selectedVariantIds} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
                        Bulk add variants
                    </h2>
                    <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4 space-y-3">
                        <div className="text-xs text-neutral-400 mb-1">
                            Add multiple size / color combinations at once. Leave unused rows empty.
                        </div>
                        <div className="space-y-2">
                            {bulkRows.map((row, idx) => (
                                <div
                                    key={idx}
                                    className="grid gap-2 grid-cols-4 items-center"
                                >
                                    <input
                                        placeholder="Size"
                                        value={row.size ?? ''}
                                        onChange={(e) =>
                                            setBulkRows((rows) =>
                                                rows.map((r, i) =>
                                                    i === idx ? { ...r, size: e.target.value } : r
                                                )
                                            )
                                        }
                                        className="rounded-md bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-white"
                                    />
                                    <input
                                        placeholder="Color"
                                        value={row.color ?? ''}
                                        onChange={(e) =>
                                            setBulkRows((rows) =>
                                                rows.map((r, i) =>
                                                    i === idx ? { ...r, color: e.target.value } : r
                                                )
                                            )
                                        }
                                        className="rounded-md bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-white"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={row.quantity ?? 0}
                                        onChange={(e) =>
                                            setBulkRows((rows) =>
                                                rows.map((r, i) =>
                                                    i === idx
                                                        ? { ...r, quantity: Number(e.target.value) || 0 }
                                                        : r
                                                )
                                            )
                                        }
                                        className="rounded-md bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-white"
                                    />
                                    <select
                                        value={row.locationId ?? ''}
                                        onChange={(e) =>
                                            setBulkRows((rows) =>
                                                rows.map((r, i) =>
                                                    i === idx
                                                        ? {
                                                            ...r,
                                                            locationId:
                                                                e.target.value === ''
                                                                    ? undefined
                                                                    : Number(e.target.value),
                                                        }
                                                        : r
                                                )
                                            )
                                        }
                                        className="rounded-md bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-white"
                                    >
                                        <option value="">No location</option>
                                        {locations.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setBulkRows((rows) => [
                                        ...rows,
                                        { size: '', color: '', quantity: 0, locationId: undefined },
                                    ])
                                }
                                className="text-xs px-3 py-1 rounded-md border border-neutral-600 text-neutral-100 hover:bg-neutral-800"
                            >
                                Add row
                            </button>
                            <button
                                type="button"
                                disabled={createVariantsMutation.isPending}
                                onClick={() => createVariantsMutation.mutate()}
                                className="text-xs px-3 py-1 rounded-md bg-teal-500 text-neutral-900 font-semibold hover:bg-teal-400 disabled:opacity-60"
                            >
                                {createVariantsMutation.isPending ? 'Saving…' : 'Save variants'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

