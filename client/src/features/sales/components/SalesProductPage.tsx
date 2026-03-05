import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useSalesCartStore } from '@/stores/salesCartStore';
import { salesDb } from '@/lib/salesDb';

interface VariantScanResult {
    id: string;
    productName: string;
    size: number | null;
    color: string | null;
    sellingPrice: string | null;
    image: string | null;
}

async function fetchScan(code: string): Promise<VariantScanResult> {
    const { data } = await apiClient.get<{ data: VariantScanResult }>(`/scan/${encodeURIComponent(code)}`);
    return data.data;
}

export function SalesProductPage() {
    const { variantId } = useParams<{ variantId: string }>();
    const [quantity, setQuantity] = useState(1);
    const [offline, setOffline] = useState<VariantScanResult | null>(null);
    const navigate = useNavigate();
    const addItem = useSalesCartStore((s) => s.addItem);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['sales', 'scan', variantId],
        queryFn: () => fetchScan(variantId!),
        enabled: !!variantId,
    });

    useEffect(() => {
        if (data) {
            const price = Number(data.sellingPrice ?? 0);
            salesDb.productsCache.put({
                variantId: data.id,
                productName: data.productName,
                size: data.size,
                color: data.color,
                price,
                image: data.image,
                updatedAt: Date.now(),
            });
            setOffline(null);
        }
    }, [data]);

    useEffect(() => {
        let mounted = true;
        async function loadOffline() {
            if (!variantId) return;
            const cached = await salesDb.productsCache.get(variantId);
            if (mounted && cached) {
                setOffline({
                    id: cached.variantId,
                    productName: cached.productName,
                    size: cached.size ?? null,
                    color: cached.color ?? null,
                    sellingPrice: String(cached.price),
                    image: cached.image ?? null,
                });
            }
        }
        if (isError) {
            void loadOffline();
        }
        return () => {
            mounted = false;
        };
    }, [isError, variantId]);

    if (!variantId) return <p className="text-red-400 p-4">Missing variant code.</p>;

    if (isLoading && !offline) return <p className="text-neutral-300 p-4">Loading product…</p>;

    if ((isError || !data) && !offline) {
        return (
            <div className="p-4 space-y-3">
                <p className="text-red-400">Could not load product for this QR code.</p>
                <button
                    onClick={() => navigate('/sales/scan')}
                    className="px-4 py-2 rounded-md bg-neutral-800 text-sm"
                >
                    Scan again
                </button>
            </div>
        );
    }

    const effective = data ?? offline!;
    const price = Number(effective.sellingPrice ?? 0);

    const handleAddToCart = () => {
        addItem(
            {
                variantId: effective.id,
                productName: effective.productName,
                size: effective.size,
                color: effective.color,
                price,
            },
            quantity
        );
        navigate('/sales/cart');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 space-y-3">
                {effective.image && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-neutral-900 mb-2">
                        <img src={effective.image} alt={effective.productName} className="w-full h-full object-cover" />
                    </div>
                )}
                <h1 className="text-xl font-semibold">{effective.productName}</h1>
                <p className="text-sm text-gray-400">
                    Size: {effective.size ?? '—'} · Color: {effective.color ?? '—'}
                </p>
                <p className="text-lg font-bold text-teal-400">
                    ₹{price.toFixed(2)}
                </p>
                {offline && (
                    <p className="text-xs text-amber-400">Offline data</p>
                )}
            </div>
            <div className="mt-auto p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-300">Quantity</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-lg"
                        >
                            -
                        </button>
                        <span className="min-w-[24px] text-center">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => q + 1)}
                            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-lg"
                        >
                            +
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleAddToCart}
                    className="w-full py-3 rounded-xl bg-teal-500 text-neutral-900 font-bold text-base"
                >
                    Add to cart
                </button>
            </div>
        </div>
    );
}

