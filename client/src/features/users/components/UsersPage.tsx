import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/apiClient';

const userSchema = z.object({
    username: z.string().min(3),
    fullName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    role: z.enum(['admin', 'inventory_manager', 'salesman', 'cashier']),
    password: z.string().min(6),
});

type UserForm = z.infer<typeof userSchema>;

interface User {
    id: string;
    username: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
}

async function fetchUsers(): Promise<User[]> {
    const { data } = await apiClient.get<{ data: User[] }>('/users');
    return data.data;
}

export function UsersPage() {
    const queryClient = useQueryClient();
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserForm>({
        resolver: zodResolver(userSchema),
    });

    const createMutation = useMutation({
        mutationFn: (payload: UserForm) => apiClient.post('/users', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            reset();
        },
    });

    const onSubmit = (values: UserForm) => {
        createMutation.mutate(values);
    };

    const toggleActive = useMutation({
        mutationFn: (u: User) =>
            apiClient.patch(`/users/${u.id}/${u.isActive ? 'deactivate' : 'activate'}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Users</h1>
                    <p className="text-sm text-neutral-400">
                        Manage staff accounts and roles for this shop.
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4 space-y-3"
            >
                <div className="grid gap-3 md:grid-cols-5">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Username
                        </label>
                        <input
                            {...register('username')}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                        {errors.username && (
                            <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Full name
                        </label>
                        <input
                            {...register('fullName')}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Email
                        </label>
                        <input
                            {...register('email')}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Phone
                        </label>
                        <input
                            {...register('phone')}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Role
                        </label>
                        <select
                            {...register('role')}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        >
                            <option value="admin">Admin</option>
                            <option value="inventory_manager">Inventory manager</option>
                            <option value="salesman">Salesman</option>
                            <option value="cashier">Cashier</option>
                        </select>
                        {errors.role && (
                            <p className="text-xs text-red-400 mt-1">{errors.role.message}</p>
                        )}
                    </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            {...register('password')}
                            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                        />
                        {errors.password && (
                            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                        )}
                    </div>
                    <div className="md:col-span-2 flex items-end">
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-teal-500 text-sm font-semibold text-neutral-900 hover:bg-teal-400 disabled:opacity-60"
                        >
                            {createMutation.isPending ? 'Creating…' : 'Add user'}
                        </button>
                    </div>
                </div>
            </form>

            <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-900 border-b border-neutral-700">
                    <tr className="text-left text-neutral-400">
                        <th className="px-4 py-2">Username</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                                No users found.
                            </td>
                        </tr>
                    )}
                    {users.map((u) => (
                        <tr key={u.id} className="border-t border-neutral-800 hover:bg-neutral-900/70">
                            <td className="px-4 py-3 text-neutral-100 font-medium">{u.username}</td>
                            <td className="px-4 py-3 text-neutral-300">
                                {u.fullName || <span className="text-neutral-500">—</span>}
                            </td>
                            <td className="px-4 py-3 text-neutral-300 capitalize">
                                {u.role.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border ${
                                        u.isActive
                                            ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                                            : 'border-neutral-600 text-neutral-300 bg-neutral-800'
                                    }`}
                                >
                                    {u.isActive ? 'Active' : 'Disabled'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => toggleActive.mutate(u)}
                                    className="text-xs font-medium px-3 py-1 rounded-md border border-neutral-600 text-neutral-100 hover:bg-neutral-800"
                                >
                                    {u.isActive ? 'Disable' : 'Enable'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

