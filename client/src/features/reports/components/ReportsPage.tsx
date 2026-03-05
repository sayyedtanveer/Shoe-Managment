import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

type SalesGroupBy = 'day' | 'product' | 'salesman';

interface SalesRow {
    label: string;
    orders?: number;
    quantity?: number;
    total: string | number;
}

interface InventorySummary {
    stockValue: string | number;
    lowStockCount: number;
}

interface InventoryRow {
    variantId: string;
    product: string;
    sku: string;
    quantity: number;
    sellingPrice: string | number;
    value: string | number;
    lowStock: boolean;
}

interface GstSummary {
    taxableValue: string | number;
    gstAmount: string | number;
    totalSales: string | number;
    invoices: number;
}

function formatCurrency(value: string | number) {
    return `₹${Number(value ?? 0).toFixed(2)}`;
}

function SalesChart({ data }: { data: Array<{ label: string; total: number }> }) {
    if (!data.length) {
        return <p className="text-sm text-neutral-500">No sales rows for selected filters.</p>;
    }

    const max = Math.max(...data.map((d) => d.total), 1);

    return (
        <div className="space-y-2">
            {data.map((row) => (
                <div key={row.label} className="text-xs">
                    <div className="flex items-center justify-between mb-1 text-neutral-300">
                        <span className="truncate max-w-[75%]">{row.label}</span>
                        <span className="font-medium text-teal-300">{formatCurrency(row.total)}</span>
                    </div>
                    <div className="h-2 rounded bg-neutral-800">
                        <div
                            className="h-2 rounded bg-teal-500"
                            style={{ width: `${(row.total / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ReportsPage() {
    const today = new Date().toISOString().slice(0, 10);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [groupBy, setGroupBy] = useState<SalesGroupBy>('day');
    const [month, setMonth] = useState(today.slice(0, 7));
    const [exportMessage, setExportMessage] = useState<string | null>(null);

    const salesQuery = useQuery({
        queryKey: ['reports', 'sales', from, to, groupBy],
        queryFn: async () => {
            const { data } = await apiClient.get<{ data: SalesRow[] }>('/reports/sales', {
                params: { from, to, groupBy },
            });
            return data.data;
        },
    });

    const inventoryQuery = useQuery({
        queryKey: ['reports', 'inventory'],
        queryFn: async () => {
            const { data } = await apiClient.get<{ data: { summary: InventorySummary; items: InventoryRow[] } }>(
                '/reports/inventory'
            );
            return data.data;
        },
    });

    const gstQuery = useQuery({
        queryKey: ['reports', 'gst', month],
        queryFn: async () => {
            const { data } = await apiClient.get<{ data: GstSummary }>('/reports/gst', {
                params: { month },
            });
            return data.data;
        },
    });

    const salesRows = useMemo(
        () =>
            (salesQuery.data ?? []).map((r) => ({
                label: r.label,
                total: Number(r.total ?? 0),
                orders: Number(r.orders ?? 0),
                quantity: Number(r.quantity ?? 0),
            })),
        [salesQuery.data]
    );

    const salesTotal = useMemo(
        () => salesRows.reduce((sum, row) => sum + Number(row.total || 0), 0),
        [salesRows]
    );

    const exportGstPdf = async () => {
        const summary = gstQuery.data;
        if (!summary) return;

        try {
            const jsPdfModule = await import('jspdf');
            const doc = new jsPdfModule.jsPDF();
            doc.setFontSize(16);
            doc.text('GST Monthly Summary', 14, 18);
            doc.setFontSize(11);
            doc.text(`Month: ${month}`, 14, 30);
            doc.text(`Taxable Sales: ${formatCurrency(summary.taxableValue)}`, 14, 40);
            doc.text(`GST Amount: ${formatCurrency(summary.gstAmount)}`, 14, 48);
            doc.text(`Total Sales: ${formatCurrency(summary.totalSales)}`, 14, 56);
            doc.text(`Invoices: ${Number(summary.invoices ?? 0)}`, 14, 64);
            doc.save(`gst-summary-${month}.pdf`);
            setExportMessage('GST PDF exported.');
        } catch {
            window.print();
            setExportMessage('jsPDF unavailable in this environment; opened print dialog as fallback.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="text-sm text-neutral-400">Sales, inventory and GST analytics for current shop.</p>
            </div>

            <section className="rounded-xl border border-neutral-700 bg-neutral-900/50 p-4 space-y-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-neutral-400 mb-1">From</label>
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1" />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-400 mb-1">To</label>
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1" />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-400 mb-1">Group by</label>
                        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as SalesGroupBy)} className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1">
                            <option value="day">Day</option>
                            <option value="product">Product</option>
                            <option value="salesman">Salesman</option>
                        </select>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-xs text-neutral-400">Total Sales</p>
                        <p className="text-lg font-semibold text-teal-300">{formatCurrency(salesTotal)}</p>
                    </div>
                </div>

                <SalesChart data={salesRows} />

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-neutral-400 border-b border-neutral-700">
                            <tr>
                                <th className="py-2 pr-3">{groupBy}</th>
                                <th className="py-2 pr-3 text-right">Orders/Qty</th>
                                <th className="py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesRows.map((row) => (
                                <tr key={row.label} className="border-b border-neutral-800">
                                    <td className="py-2 pr-3">{row.label}</td>
                                    <td className="py-2 pr-3 text-right">{groupBy === 'product' ? row.quantity : row.orders}</td>
                                    <td className="py-2 text-right text-teal-300">{formatCurrency(row.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="rounded-xl border border-neutral-700 bg-neutral-900/50 p-4 space-y-3">
                <h2 className="text-lg font-semibold">Inventory Report</h2>
                <p className="text-sm text-neutral-300">
                    Stock value: {formatCurrency(inventoryQuery.data?.summary?.stockValue ?? 0)} · Low stock items:{' '}
                    {Number(inventoryQuery.data?.summary?.lowStockCount ?? 0)}
                </p>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-neutral-400 border-b border-neutral-700">
                            <tr>
                                <th className="py-2 pr-3">Product</th>
                                <th className="py-2 pr-3">SKU</th>
                                <th className="py-2 pr-3 text-right">Qty</th>
                                <th className="py-2 pr-3 text-right">Unit Price</th>
                                <th className="py-2 pr-3 text-right">Value</th>
                                <th className="py-2 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(inventoryQuery.data?.items ?? []).map((row) => (
                                <tr key={row.variantId} className="border-b border-neutral-800">
                                    <td className="py-2 pr-3">{row.product}</td>
                                    <td className="py-2 pr-3 text-neutral-400">{row.sku}</td>
                                    <td className="py-2 pr-3 text-right">{row.quantity}</td>
                                    <td className="py-2 pr-3 text-right">{formatCurrency(row.sellingPrice)}</td>
                                    <td className="py-2 pr-3 text-right">{formatCurrency(row.value)}</td>
                                    <td className="py-2 text-right">{row.lowStock ? '⚠️ Low' : 'OK'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="rounded-xl border border-neutral-700 bg-neutral-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">GST Report</h2>
                    <button onClick={exportGstPdf} className="px-3 py-1 rounded bg-teal-500 text-black font-medium">
                        Export PDF
                    </button>
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Month</label>
                    <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1" />
                </div>
                {exportMessage && <p className="text-xs text-neutral-400">{exportMessage}</p>}
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <p>Taxable sales: <span className="text-teal-300">{formatCurrency(gstQuery.data?.taxableValue ?? 0)}</span></p>
                    <p>GST amount: <span className="text-teal-300">{formatCurrency(gstQuery.data?.gstAmount ?? 0)}</span></p>
                    <p>Total sales: <span className="text-teal-300">{formatCurrency(gstQuery.data?.totalSales ?? 0)}</span></p>
                    <p>Invoices: <span className="text-teal-300">{Number(gstQuery.data?.invoices ?? 0)}</span></p>
                </div>
            </section>
        </div>
    );
}
