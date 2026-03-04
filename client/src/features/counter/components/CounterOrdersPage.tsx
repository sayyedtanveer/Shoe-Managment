import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { enqueueOfflineOperation, isNetworkError } from '@/lib/offlineClient';

interface CreateOrderPayload {
    customerId?: string;
    paymentMethod: string;
    discount?: number;
    items: Array<{
        variantId: string;
        quantity: number;
    }>;
}

export function CounterOrdersPage() {
    const [variantId, setVariantId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerId, setCustomerId] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (payload: CreateOrderPayload) => {
            const { data } = await apiClient.post('/orders', {
                ...payload,
            });
            return data;
        },
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        const payload: CreateOrderPayload = {
            paymentMethod,
            items: [{ variantId, quantity }],
            ...(customerId ? { customerId } : {}),
        };

        try {
            await mutateAsync(payload);
            setMessage('Order created successfully.');
            setVariantId('');
            setQuantity(1);
        } catch (err) {
            if (isNetworkError(err)) {
                await enqueueOfflineOperation('create_order', payload as unknown as Record<string, unknown>);
                setMessage('Network issue detected. Order queued for sync when online.');
            } else {
                setError(
                    (err as any)?.response?.data?.message ??
                    'Failed to create order.'
                );
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <h1 className="text-xl font-semibold text-white mb-2">New Order</h1>
            <p className="text-sm text-gray-400 mb-4">
                Minimal POS form for creating a quick order. For now, enter a variant ID directly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 bg-surface-card/80 border border-surface-border rounded-xl p-4">
                {message && (
                    <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            Variant ID
                        </label>
                        <input
                            type="text"
                            value={variantId}
                            onChange={(e) => setVariantId(e.target.value)}
                            required
                            className="w-full rounded-md bg-surface border border-surface-border px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            Quantity
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                            className="w-full rounded-md bg-surface border border-surface-border px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            Payment Method
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full rounded-md bg-surface border border-surface-border px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                            <option value="mixed">Mixed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            Customer ID (optional)
                        </label>
                        <input
                            type="text"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full rounded-md bg-surface border border-surface-border px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary-600 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60"
                >
                    {isPending ? 'Creating…' : 'Create Order'}
                </button>
            </form>
        </div>
    );
}

