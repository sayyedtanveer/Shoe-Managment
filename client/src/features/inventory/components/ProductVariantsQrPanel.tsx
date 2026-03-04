import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Props {
    variantIds: string[];
}

interface QrResult {
    variantId: string;
    qrDataUrl: string;
}

export function ProductVariantsQrPanel({ variantIds }: Props) {
    const [results, setResults] = useState<QrResult[]>([]);

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post<{ data: QrResult[] }>('/qr/generate', {
                variantIds,
            });
            return data.data;
        },
        onSuccess: (data) => setResults(data),
    });

    const handleGenerate = () => {
        if (variantIds.length === 0) return;
        mutation.mutate();
    };

    const handlePrint = () => {
        if (variantIds.length === 0) return;
        const query = encodeURIComponent(variantIds.join(','));
        window.open(`/api/v1/qr/print-pdf?ids=${query}`, '_blank');
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={variantIds.length === 0 || mutation.isPending}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-teal-500 text-xs font-semibold text-neutral-900 hover:bg-teal-400 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Generating…' : 'Generate QR codes'}
                </button>
                <button
                    type="button"
                    onClick={handlePrint}
                    disabled={variantIds.length === 0}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-neutral-800 text-xs font-semibold text-neutral-100 hover:bg-neutral-700 disabled:opacity-50"
                >
                    Print labels (PDF)
                </button>
            </div>
            {results.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-900/60 border border-neutral-700 rounded-xl p-3">
                    {results.map((r) => (
                        <div key={r.variantId} className="flex flex-col items-center gap-2">
                            <img src={r.qrDataUrl} alt={r.variantId} className="w-24 h-24 bg-white rounded-md" />
                            <span className="text-[10px] text-neutral-400 truncate max-w-[96px]">
                                {r.variantId}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

