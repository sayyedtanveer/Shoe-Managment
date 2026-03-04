import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
    LayoutDashboard, Package, ShoppingCart, Users,
    BarChart3, Settings, LogOut, Menu, X, Footprints
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/inventory', icon: Package, label: 'Inventory' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-surface overflow-hidden">
            {/* ── Sidebar ──────────────────────────────────────── */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} flex-shrink-0 bg-surface-card border-r border-surface-border
          flex flex-col transition-all duration-300 ease-in-out`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-border">
                    <Footprints className="text-primary-400 w-7 h-7 flex-shrink-0" />
                    {sidebarOpen && (
                        <span className="text-lg font-bold gradient-text truncate">ShoeFlow</span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/admin'}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User footer */}
                <div className="p-3 border-t border-surface-border">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-surface/50">
                            <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center text-primary-400 font-semibold text-sm uppercase">
                                {user?.fullName?.[0] ?? user?.username?.[0] ?? 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.fullName ?? user?.username}</p>
                                <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="h-16 bg-surface-card/70 backdrop-blur border-b border-surface-border flex items-center px-6 gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="flex-1" />
                    {/* Role badge */}
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary-600/20 text-primary-400 border border-primary-600/30 capitalize">
                        {user?.role?.replace('_', ' ')}
                    </span>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
