import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { CounterLayout } from '@/layouts/CounterLayout';
import LoginPage from '@/features/auth/components/LoginPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { InventoryPage } from '@/features/inventory/components/InventoryPage';
import { CustomersPage } from '@/features/customers/components/CustomersPage';
import { OrdersPage } from '@/features/orders/components/OrdersPage';

export default function App() {
    return (
        <Routes>
            {/* ── Public routes ───────────────────────────────── */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* ── Admin routes ─────────────────────────────────── */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="orders" element={<OrdersPage />} />
            </Route>

            {/* ── Counter / Cashier routes ──────────────────────── */}
            <Route
                path="/counter"
                element={
                    <ProtectedRoute allowedRoles={['cashier']}>
                        <CounterLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
            </Route>

            {/* ── Salesman routes ───────────────────────────────── */}
            <Route
                path="/salesman"
                element={
                    <ProtectedRoute allowedRoles={['salesman']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
            </Route>

            {/* ── General dashboard (any authenticated) ────────── */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
            </Route>

            {/* ── Default redirect ──────────────────────────────── */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
