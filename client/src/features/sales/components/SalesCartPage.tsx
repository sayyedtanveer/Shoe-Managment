import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useSalesCartStore } from '@/stores/salesCartStore';
import { useAuthStore } from '@/stores/authStore';
import { salesDb } from '@/lib/salesDb';

export function SalesCartPage() {
    const { items, clear } = useSalesCartStore();
    const user = useAuthStore((s) => s.user);
    const qc = useQueryClient();
    const [submitting, setSubmitting] = useState(false);

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = {
                items: items.map((i) => ({
                    variantId: i.variantId,
                    quantity: i.quantity,
                })),
            };
            const { data } = await apiClient.post('/orders', payload);
            return data;
        },
        onSuccess: () => {
            clear();
            qc.invalidateQueries({ queryKey: ['sales', 'pending-self'] });
        },
    });

    const handleSendToCounter = async () => {
        if (!items.length || !user) return;
        setSubmitting(true);
        try {
            await mutation.mutateAsync();
        } catch {
            // fallback offline: store pending order locally
            await salesDb.pendingOrders.add({
                shopId: user.shopId,
                salesmanId: user.id,
                items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
                createdAt: Date.now(),
                synced: false,
            });
            clear();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4">
                <h1 className="text-xl font-semibold mb-2">Cart</h1>
            </div>
            <div className="flex-1 overflow-auto px-4 space-y-2">
                {items.length === 0 && (
                    <p className="text-sm text-neutral-500">Cart is empty. Scan a product to add.</p>
                )}
                {items.map((item) => (
                    <div
                        key={item.variantId}
                        className="rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-3 text-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-neutral-100">
                                    {item.productName}
                                </div>
                                <div className="text-xs text-neutral-500">
                                    Size: {item.size ?? '—'} · Color: {item.color ?? '—'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-neutral-400">
                                    {item.quantity} × ₹{item.price.toFixed(2)}
                                </div>
                                <div className="text-sm font-semibold text-teal-400">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 space-y-3 border-t border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">Total</span>
                    <span className="text-lg font-semibold text-teal-400">
                        ₹{total.toFixed(2)}
                    </span>
                </div>
                <button
                    onClick={handleSendToCounter}
                    disabled={!items.length || submitting}
                    className="w-full py-3 rounded-xl bg-teal-500 text-neutral-900 font-bold text-base disabled:opacity-50"
                >
                    {submitting ? 'Sending…' : 'Send to counter'}
                </button>
            </div>
        </div>
    );
}

