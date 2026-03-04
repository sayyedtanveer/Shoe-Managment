import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Footprints, LogOut, Clock } from 'lucide-react';

/**
 * Simplified full-screen layout for the counter/cashier POS view.
 * Minimal chrome – maximises screen space for the POS interface.
 */
export function CounterLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-surface overflow-hidden">
            {/* ── Compact top bar ──────────────────────────────── */}
            <header className="h-14 bg-surface-card border-b border-surface-border flex items-center px-6 gap-4 flex-shrink-0">
                <Footprints className="text-primary-400 w-6 h-6" />
                <span className="font-bold text-white">ShoeFlow</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400 border border-accent-500/30">
                    Counter
                </span>

                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span id="counter-clock">{new Date().toLocaleTimeString()}</span>
                    </div>
                </div>

                <span className="text-sm text-gray-400">{user?.fullName ?? user?.username}</span>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </header>

            {/* ── POS content area ─────────────────────────────── */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
