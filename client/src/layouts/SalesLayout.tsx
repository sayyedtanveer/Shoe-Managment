import { Outlet, NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Clock } from 'lucide-react';

export function SalesLayout() {
    return (
        <div className="flex flex-col h-screen bg-surface text-white">
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
            <nav className="h-14 border-t border-surface-border bg-surface-card flex items-stretch">
                <NavLink
                    to="/sales/home"
                    className={({ isActive }) =>
                        `flex-1 flex flex-col items-center justify-center text-xs ${
                            isActive ? 'text-teal-400' : 'text-gray-400'
                        }`
                    }
                >
                    <Home className="w-4 h-4 mb-0.5" />
                    Home
                </NavLink>
                <NavLink
                    to="/sales/cart"
                    className={({ isActive }) =>
                        `flex-1 flex flex-col items-center justify-center text-xs ${
                            isActive ? 'text-teal-400' : 'text-gray-400'
                        }`
                    }
                >
                    <ShoppingCart className="w-4 h-4 mb-0.5" />
                    Cart
                </NavLink>
                <NavLink
                    to="/sales/pending"
                    className={({ isActive }) =>
                        `flex-1 flex flex-col items-center justify-center text-xs ${
                            isActive ? 'text-teal-400' : 'text-gray-400'
                        }`
                    }
                >
                    <Clock className="w-4 h-4 mb-0.5" />
                    Pending
                </NavLink>
            </nav>
        </div>
    );
}

