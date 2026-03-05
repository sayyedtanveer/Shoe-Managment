import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';

interface Brand {
    id: number;
    name: string;
    gstRate: number;
}

interface ProductVariant {
    id: string;
    size: number | null;
    color: string | null;
    quantity: number;
}

interface Product {
    id: string;
    model: string;
    brand?: Brand | null;
    category?: { id: number; name: string } | null;
    sellingPrice?: string | null;
    isActive: boolean;
    variants: ProductVariant[];
}

async function fetchProducts(params: {
    brandId?: number;
    categoryId?: number;
    search?: string;
    page: number;
    pageSize: number;
}): Promise<Product[]> {
    const { data } = await apiClient.get<{ data: Product[] }>('/inventory/products', {
        params,
    });
    return data.data;
}

export function InventoryPage() {
    const filters = useInventoryFilterStore();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['inventory', 'products', filters],
        queryFn: () =>
            fetchProducts({
                brandId: filters.brandId,
                categoryId: filters.categoryId,
                search: filters.search,
                page: filters.page,
                pageSize: filters.pageSize,
            }),
    });

    if (isLoading) {
        return <p className="text-neutral-300">Loading inventory…</p>;
    }

    if (isError) {
        return <p className="text-red-400">Failed to load inventory.</p>;
    }

    const products = data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                <h1 className="text-2xl font-bold mb-1">Inventory</h1>
                <p className="text-sm text-neutral-400">
                    Overview of products, variants, and stock levels for this shop.
                </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <input
                        placeholder="Search model…"
                        className="rounded-md bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm text-white"
                        value={filters.search ?? ''}
                        onChange={(e) => filters.setSearch(e.target.value || undefined)}
                    />
                </div>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                    <tr className="text-left text-neutral-400">
                        <th className="px-4 py-2">Model</th>
                        <th className="px-4 py-2">Brand</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Price</th>
                        <th className="px-4 py-2">Variants</th>
                        <th className="px-4 py-2 text-right">Total Stock</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                                No products found. Start by adding products from the API or backoffice tools.
                            </td>
                        </tr>
                    )}
                    {products.map((p) => {
                        const totalStock = p.variants.reduce((sum, v) => sum + v.quantity, 0);
                        return (
                            <tr
                                key={p.id}
                                className="border-t border-neutral-800 hover:bg-neutral-900/70 cursor-pointer"
                                onClick={() => navigate(`/admin/inventory/products/${p.id}`)}
                            >
                                <td className="px-4 py-3">
                                    <div className="font-medium text-white">{p.model}</div>
                                    {!p.isActive && (
                                        <span className="inline-flex mt-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                    {p.brand?.name ?? <span className="text-neutral-500">—</span>}
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                    {p.category?.name ?? <span className="text-neutral-500">—</span>}
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                    {p.sellingPrice ? `₹${p.sellingPrice}` : <span className="text-neutral-500">—</span>}
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                    {p.variants.length === 0 ? (
                                        <span className="text-neutral-500">No variants</span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {p.variants.slice(0, 4).map((v) => (
                                                <span
                                                    key={v.id}
                                                    className="inline-flex items-center rounded-full border border-neutral-700 px-2 py-0.5 text-[11px] text-neutral-300"
                                                >
                                                    {v.size ?? '—'} / {v.color ?? '—'} · {v.quantity}
                                                </span>
                                            ))}
                                            {p.variants.length > 4 && (
                                                <span className="text-[11px] text-neutral-500">
                                                    +{p.variants.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right text-neutral-100 font-semibold">
                                    {totalStock}
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

