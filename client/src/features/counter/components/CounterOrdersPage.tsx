import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

interface CounterOrderItem {
    id: string;
    quantity: number;
    total: number | null;
    variant: {
        id: string;
        size?: string | null;
        color?: string | null;
        product: {
            name: string;
        };
    };
}

interface CounterOrder {
    id: string;
    orderNumber: string;
    status: 'pending' | 'completed' | 'processing' | 'cancelled';
    subtotal: number | null;
    discount: number | null;
    tax: number | null;
    total: number | null;
    createdAt: string;
    customer: {
        id: string;
        name?: string | null;
        phone?: string | null;
    } | null;
    salesman: {
        id: string;
        fullName: string | null;
        username: string;
    } | null;
    orderItems: CounterOrderItem[];
}

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ??
    (import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1$/, '')
        : window.location.origin);

async function fetchCounterQueue(): Promise<CounterOrder[]> {
    const { data } = await apiClient.get<{ data: CounterOrder[] }>('/orders/queue');
    return data.data;
}

export function CounterOrdersPage() {
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const qc = useQueryClient();

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState<number | ''>('');
    const [discount, setDiscount] = useState<number | ''>('');
    const [formMessage, setFormMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const { data: orders = [], isLoading, isError } = useQuery({
        queryKey: ['counter', 'queue'],
        queryFn: fetchCounterQueue,
        refetchOnWindowFocus: false,
    });

    const selectedOrder = useMemo(
        () => orders.find((o) => o.id === selectedOrderId) ?? null,
        [orders, selectedOrderId]
    );

    useEffect(() => {
        if (!accessToken || !user) return;

        let socket: Socket | null = io(SOCKET_URL, {
            auth: { token: accessToken },
            withCredentials: true,
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            socket?.emit('join_counter');
        });

        socket.on('new_order', (order: CounterOrder) => {
            qc.setQueryData<CounterOrder[]>(['counter', 'queue'], (current) => {
                const list = current ?? [];
                if (list.some((o) => o.id === order.id)) return list;
                return [...list, order].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
            });
        });

        socket.on('order_completed', (order: CounterOrder) => {
            qc.setQueryData<CounterOrder[]>(['counter', 'queue'], (current) =>
                (current ?? []).filter((o) => o.id !== order.id)
            );
            setSelectedOrderId((currentId) => (currentId === order.id ? null : currentId));
        });

        return () => {
            socket?.disconnect();
            socket = null;
        };
    }, [accessToken, user, qc]);

    useEffect(() => {
        if (selectedOrder) {
            setPaymentMethod('cash');
            const total = Number(selectedOrder.total ?? 0);
            setAmountPaid(total || '');
            setDiscount(selectedOrder.discount ?? '');
            setFormMessage(null);
            setFormError(null);
        } else {
            setAmountPaid('');
            setDiscount('');
        }
    }, [selectedOrder]);

    const completeMutation = useMutation({
        mutationFn: async () => {
            if (!selectedOrder) throw new Error('No order selected');

            const payload = {
                paymentMethod,
                amountPaid: typeof amountPaid === 'number' ? amountPaid : Number(amountPaid || 0),
                ...(discount !== ''
                    ? { discount: typeof discount === 'number' ? discount : Number(discount) }
                    : {}),
            };

            const { data } = await apiClient.put(`/orders/${selectedOrder.id}/complete`, payload);
            return data;
        },
        onSuccess: () => {
            setFormMessage('Payment recorded and order completed.');
            setFormError(null);
            qc.invalidateQueries({ queryKey: ['counter', 'queue'] });
            setSelectedOrderId(null);
        },
        onError: (error: any) => {
            setFormMessage(null);
            setFormError(error?.response?.data?.message ?? 'Failed to complete order.');
        },
    });



    const assignCustomerMutation = useMutation({
        mutationFn: async (customerId: string) => {
            if (!selectedOrder) throw new Error('No order selected');
            await apiClient.patch(`/orders/${selectedOrder.id}/customer`, { customerId });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['counter', 'queue'] });
            setShowCustomerModal(false);
            setCustomerName('');
            setCustomerPhone('');
        },
    });

    const createAndAssignMutation = useMutation({
        mutationFn: async () => {
            if (!selectedOrder) throw new Error('No order selected');
            const created = await apiClient.post('/customers', { name: customerName || undefined, phone: customerPhone || undefined });
            const customerId = created.data?.data?.id;
            await apiClient.patch(`/orders/${selectedOrder.id}/customer`, { customerId });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['counter', 'queue'] });
            setShowCustomerModal(false);
            setCustomerName('');
            setCustomerPhone('');
        },
    });

    const handleSelectOrder = (order: CounterOrder) => {
        setSelectedOrderId(order.id);
    };

    const handleSubmitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || completeMutation.isPending) return;
        completeMutation.mutate();
    };

    const renderQueueStatus = () => {
        if (isLoading) {
            return <p className="text-xs text-gray-400 px-3 py-2">Loading queue…</p>;
        }
        if (isError) {
            return (
                <p className="text-xs text-red-400 px-3 py-2">
                    Failed to load queue. Ensure you are connected.
                </p>
            );
        }
        if (!orders.length) {
            return (
                <p className="text-xs text-gray-500 px-3 py-2">
                    No pending orders in the queue.
                </p>
            );
        }
        return null;
    };

    const effectiveTotal = selectedOrder
        ? Number(selectedOrder.subtotal ?? 0) -
          Number(discount === '' ? selectedOrder.discount ?? 0 : discount || 0) +
          Number(selectedOrder.tax ?? 0)
        : 0;

    const paid = typeof amountPaid === 'number' ? amountPaid : Number(amountPaid || 0);
    const change = paid - effectiveTotal;

    return (
        <div className="h-full flex flex-col lg:flex-row">
            <section className="lg:w-2/5 border-r border-surface-border bg-surface-card/40">
                <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-white">Counter Queue</h1>
                        <p className="text-xs text-gray-400">
                            Live stream of pending orders from salesmen.
                        </p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                        <div>{user?.shopId}</div>
                        <div className="text-[10px] uppercase tracking-wide">Cashier view</div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto py-2 space-y-1">
                    {renderQueueStatus()}
                    {orders.map((order) => {
                        const total = Number(order.total ?? 0);
                        const created = new Date(order.createdAt);
                        const isSelected = order.id === selectedOrderId;
                        return (
                            <button
                                key={order.id}
                                onClick={() => handleSelectOrder(order)}
                                className={`w-full text-left px-3 py-2 text-xs border-l-2 transition-colors ${
                                    isSelected
                                        ? 'bg-surface/80 border-primary-500'
                                        : 'bg-surface/40 border-transparent hover:bg-surface/80'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold text-white">
                                        {order.orderNumber}
                                    </div>
                                    <div className="text-primary-400 font-semibold">
                                        ₹{total.toFixed(2)}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-0.5 text-[11px] text-gray-400">
                                    <span>
                                        {order.salesman?.fullName ??
                                            order.salesman?.username ??
                                            'Unknown salesman'}
                                    </span>
                                    <span>{created.toLocaleTimeString()}</span>
                                </div>
                                {order.customer && (
                                    <div className="mt-0.5 text-[11px] text-teal-300">
                                        {order.customer.name ?? order.customer.phone}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="flex-1 flex flex-col bg-surface">
                <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {selectedOrder ? selectedOrder.orderNumber : 'Select an order'}
                        </h2>
                        <p className="text-xs text-gray-400">
                            Review items and record payment to complete billing.
                        </p>
                    </div>
                    {selectedOrder && (
                        <div className="text-right text-xs text-gray-400">
                            <div>
                                From:{' '}
                                <span className="text-gray-200">
                                    {selectedOrder.salesman?.fullName ??
                                        selectedOrder.salesman?.username ??
                                        'Unknown'}
                                </span>
                            </div>
                            <div>
                                Placed at:{' '}
                                {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                            </div>
                            <button type="button" onClick={() => setShowCustomerModal(true)} className="mt-2 px-2 py-1 rounded bg-primary-600 text-white">
                                {selectedOrder.customer ? 'Change Customer' : 'Add Customer'}
                            </button>
                        </div>
                    )}
                </div>

                {!selectedOrder && (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                        <div className="text-center px-6">
                            <p className="mb-1 font-medium text-gray-300">
                                No order selected
                            </p>
                            <p className="text-xs text-gray-500">
                                Choose an order from the left queue to start billing.
                            </p>
                        </div>
                    </div>
                )}

                {selectedOrder && (
                    <div className="flex-1 grid grid-rows-[minmax(0,1fr)_auto] gap-0">
                        <div className="overflow-auto px-5 py-4 space-y-3">
                            <div className="space-y-2">
                                {selectedOrder.orderItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between text-xs border-b border-surface-border/60 pb-2"
                                    >
                                        <div>
                                            <div className="text-white font-medium">
                                                {item.variant.product.name}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                Size: {item.variant.size ?? '—'} · Color:{' '}
                                                {item.variant.color ?? '—'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-300">
                                                Qty {item.quantity}
                                            </div>
                                            <div className="text-sm font-semibold text-primary-400">
                                                ₹{Number(item.total ?? 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 rounded-lg bg-surface-card/60 border border-surface-border px-4 py-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="text-gray-100">
                                        ₹{Number(selectedOrder.subtotal ?? 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Discount</span>
                                    <span className="text-amber-300">
                                        -₹
                                        {Number(
                                            discount === ''
                                                ? selectedOrder.discount ?? 0
                                                : discount || 0
                                        ).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Tax</span>
                                    <span className="text-gray-100">
                                        ₹{Number(selectedOrder.tax ?? 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="border-t border-surface-border pt-2 mt-1 flex items-center justify-between">
                                    <span className="text-gray-300 font-semibold">
                                        Grand total
                                    </span>
                                    <span className="text-lg font-bold text-primary-400">
                                        ₹{effectiveTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmitPayment}
                            className="border-t border-surface-border px-5 py-3 space-y-2 bg-surface-card/80"
                        >
                            {formMessage && (
                                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 rounded px-3 py-2">
                                    {formMessage}
                                </div>
                            )}
                            {formError && (
                                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded px-3 py-2">
                                    {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3 items-end">
                                <div className="col-span-1">
                                    <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                        Payment method
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full rounded-md bg-surface border border-surface-border px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                        Discount
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={discount}
                                        onChange={(e) =>
                                            setDiscount(
                                                e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-md bg-surface border border-surface-border px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                        Amount paid
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={amountPaid}
                                        onChange={(e) =>
                                            setAmountPaid(
                                                e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-md bg-surface border border-surface-border px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-300">
                                <div>
                                    <span className="text-gray-400 mr-1.5">Change / Due:</span>
                                    <span
                                        className={
                                            change >= 0
                                                ? 'text-emerald-400 font-semibold'
                                                : 'text-amber-300 font-semibold'
                                        }
                                    >
                                        {change >= 0
                                            ? `₹${change.toFixed(2)} back`
                                            : `₹${Math.abs(change).toFixed(2)} due`}
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={completeMutation.isPending}
                                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-md bg-primary-600 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-60"
                                >
                                    {completeMutation.isPending ? 'Completing…' : 'Complete order'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </section>

            {showCustomerModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-card p-4 space-y-3">
                        <h3 className="font-semibold">Add customer to checkout</h3>
                        <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-md bg-surface border border-surface-border px-2.5 py-1.5 text-xs" />
                        <input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full rounded-md bg-surface border border-surface-border px-2.5 py-1.5 text-xs" />
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="px-3 py-1 rounded border border-surface-border" onClick={() => setShowCustomerModal(false)}>Close</button>
                            <button type="button" className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={async () => {
                                if (!customerPhone) return;
                                const lookup = await apiClient.get('/customers/search', { params: { phone: customerPhone } });
                                const found = lookup.data?.data;
                                if (found?.id) assignCustomerMutation.mutate(found.id);
                                else createAndAssignMutation.mutate();
                            }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

