import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

type EditableRow = {
    name: string;
    quantity: number;
    price: number;
};

const mappingFields = ['ignore', 'name', 'quantity', 'price'] as const;

export function OcrStockEntryPage() {
    const [file, setFile] = useState<File | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [lines, setLines] = useState<string[]>([]);
    const [rows, setRows] = useState<EditableRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSave = rows.length > 0;

    const preview = useMemo(() => rows.map((row) => ({ ...row })), [rows]);

    const onUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await apiClient.post('/ocr/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const queuedJobId = uploadRes.data?.data?.jobId as string;
            setJobId(queuedJobId);

            const poll = async () => {
                const res = await apiClient.get(`/ocr/job/${queuedJobId}`);
                const payload = res.data?.data;
                setProgress(payload.progress ?? 0);

                if (payload.state === 'completed') {
                    const extractedLines = payload.result?.lines ?? [];
                    setLines(extractedLines);
                    const splitRows = extractedLines.map((line: string) =>
                        line
                            .split(/\s{2,}|\t|,/)
                            .map((part) => part.trim())
                            .filter(Boolean)
                    );

                    const detectedHeaders = splitRows.reduce((max, row) => (row.length > max.length ? row : max), [] as string[]);
                    setHeaders(detectedHeaders);
                    const nextMapping = Object.fromEntries(detectedHeaders.map((_, index) => [String(index), index === 0 ? 'name' : index === 1 ? 'quantity' : index === 2 ? 'price' : 'ignore']));
                    setMapping(nextMapping);

                    const parsedRows = splitRows
                        .map((cols) => {
                            const row: EditableRow = { name: '', quantity: 0, price: 0 };
                            cols.forEach((value, colIndex) => {
                                const field = nextMapping[String(colIndex)] ?? 'ignore';
                                if (field === 'name') row.name = value;
                                if (field === 'quantity') row.quantity = Number(value.replace(/[^\d.-]/g, '')) || 0;
                                if (field === 'price') row.price = Number(value.replace(/[^\d.-]/g, '')) || 0;
                            });
                            return row;
                        })
                        .filter((row) => row.name);

                    setRows(parsedRows);
                    setLoading(false);
                    return;
                }

                if (payload.state === 'failed') {
                    setError(payload.failedReason ?? 'OCR job failed');
                    setLoading(false);
                    return;
                }

                setTimeout(poll, 1200);
            };

            await poll();
        } catch (_err) {
            setError('Failed to upload/process OCR image');
            setLoading(false);
        }
    };

    const updateMapping = (columnIndex: number, value: string) => {
        const next = { ...mapping, [String(columnIndex)]: value };
        setMapping(next);

        const remapped = lines
            .map((line) => line.split(/\s{2,}|\t|,/).map((part) => part.trim()).filter(Boolean))
            .map((cols) => {
                const row: EditableRow = { name: '', quantity: 0, price: 0 };
                cols.forEach((cell, colIdx) => {
                    const key = next[String(colIdx)];
                    if (key === 'name') row.name = cell;
                    if (key === 'quantity') row.quantity = Number(cell.replace(/[^\d.-]/g, '')) || 0;
                    if (key === 'price') row.price = Number(cell.replace(/[^\d.-]/g, '')) || 0;
                });
                return row;
            })
            .filter((row) => row.name);

        setRows(remapped);
    };

    const saveToInventory = async () => {
        try {
            await apiClient.post('/ocr/confirm', {
                items: rows,
                mappingRules: mapping,
            });
            alert('Inventory updated from OCR');
        } catch (_err) {
            setError('Failed to save OCR data to inventory');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-white">OCR Stock Entry</h1>
                <p className="text-sm text-gray-400">Upload stock bill/image, map columns, and push directly into inventory.</p>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            <div
                className="border border-dashed border-surface-border rounded-2xl p-8 bg-surface-card text-center"
                onDrop={(e) => {
                    e.preventDefault();
                    setFile(e.dataTransfer.files?.[0] ?? null);
                }}
                onDragOver={(e) => e.preventDefault()}
            >
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mx-auto" />
                {file && <p className="mt-3 text-sm text-gray-300">Selected: {file.name}</p>}
                <button className="btn btn-primary mt-4" onClick={onUpload} disabled={!file || loading}>
                    {loading ? 'Processing...' : 'Upload & Extract'}
                </button>
                {jobId && <p className="mt-2 text-xs text-gray-400">Job: {jobId} | Progress: {progress}%</p>}
            </div>

            {headers.length > 0 && (
                <div className="bg-surface-card border border-surface-border rounded-2xl p-4">
                    <h2 className="text-lg font-medium text-white mb-3">Column Mapping</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                        {headers.map((header, index) => (
                            <label key={`${header}-${index}`} className="text-sm text-gray-300">
                                Column {index + 1}: <span className="text-white">{header}</span>
                                <select
                                    className="input mt-1"
                                    value={mapping[String(index)] ?? 'ignore'}
                                    onChange={(e) => updateMapping(index, e.target.value)}
                                >
                                    {mappingFields.map((field) => (
                                        <option key={field} value={field}>{field}</option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {rows.length > 0 && (
                <div className="bg-surface-card border border-surface-border rounded-2xl p-4 overflow-auto">
                    <h2 className="text-lg font-medium text-white mb-3">Editable Extracted Data</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-400 border-b border-surface-border">
                                <th className="py-2">Product Name</th>
                                <th className="py-2">Quantity</th>
                                <th className="py-2">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx} className="border-b border-surface-border/50">
                                    <td><input className="input" value={row.name} onChange={(e) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))} /></td>
                                    <td><input className="input" type="number" value={row.quantity} onChange={(e) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, quantity: Number(e.target.value) } : r))} /></td>
                                    <td><input className="input" type="number" value={row.price} onChange={(e) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, price: Number(e.target.value) } : r))} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {preview.length > 0 && (
                <div className="bg-surface-card border border-surface-border rounded-2xl p-4">
                    <h2 className="text-lg font-medium text-white mb-3">Preview ({preview.length} items)</h2>
                    <div className="space-y-2 text-sm text-gray-300">
                        {preview.slice(0, 8).map((item, index) => (
                            <p key={index}>{item.name} — Qty {item.quantity} — ₹{item.price}</p>
                        ))}
                    </div>
                    <button className="btn btn-primary mt-4" onClick={saveToInventory} disabled={!canSave}>Save to Inventory</button>
                </div>
            )}
        </div>
    );
}
