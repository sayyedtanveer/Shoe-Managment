import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface Customer { id: string; name: string | null; phone: string | null; email: string | null; totalPurchases: string; loyaltyPoints: number; }

export function CustomersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const { data = [] } = useQuery({ queryKey: ['customers', search], queryFn: async () => (await apiClient.get('/customers', { params: { search } })).data.data as Customer[] });
    const createMutation = useMutation({ mutationFn: async () => apiClient.post('/customers', { name: name || undefined, phone: phone || undefined, email: email || undefined }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setName(''); setPhone(''); setEmail(''); } });

    const handleSubmit = (e: FormEvent) => { e.preventDefault(); createMutation.mutate(); };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold mb-1">Customers</h1><input placeholder="Search by phone or name" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white" /></div>
            <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4 space-y-3"><div className="flex gap-3"><input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white" /><input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white" /><input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white" /><button type="submit" className="px-4 py-2 rounded-md bg-teal-500 text-sm font-semibold text-neutral-900">Add</button></div></form>
            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden"><table className="min-w-full text-sm"><thead><tr className="text-left text-neutral-400"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Points</th></tr></thead><tbody>{data.map((c) => <tr key={c.id} className="border-t border-neutral-800 hover:bg-neutral-900/70"><td className="px-4 py-3"><Link className="text-teal-400" to={`/admin/customers/${c.id}`}>{c.name ?? 'Unnamed'}</Link></td><td className="px-4 py-3">{c.phone ?? '—'}</td><td className="px-4 py-3 text-right">₹{c.totalPurchases}</td><td className="px-4 py-3 text-right">{c.loyaltyPoints}</td></tr>)}</tbody></table></div>
        </div>
    );
}
