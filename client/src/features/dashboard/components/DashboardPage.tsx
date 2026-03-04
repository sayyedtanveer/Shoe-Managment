import React from 'react';
import { useAuthStore } from '../../stores/authStore';

export function DashboardPage() {
    const user = useAuthStore(state => state.user);

    return (
        <div className="p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-lg">Welcome back, {user?.username}!</p>
            <div className="mt-8 bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-700/50">
                <h2 className="text-xl font-semibold mb-2">Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700">
                        <p className="text-neutral-400 text-sm">Today's Sales</p>
                        <p className="text-2xl font-bold mt-1 text-teal-400">₹0.00</p>
                    </div>
                    <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700">
                        <p className="text-neutral-400 text-sm">Total Orders</p>
                        <p className="text-2xl font-bold mt-1 text-teal-400">0</p>
                    </div>
                    <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700">
                        <p className="text-neutral-400 text-sm">Low Stock Items</p>
                        <p className="text-2xl font-bold mt-1 text-amber-400">0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
