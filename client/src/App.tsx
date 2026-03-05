import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { CounterLayout } from '@/layouts/CounterLayout';
import { SalesLayout } from '@/layouts/SalesLayout';
import LoginPage from '@/features/auth/components/LoginPage';
import { PinLoginPage } from '@/features/auth/components/PinLoginPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { InventoryPage } from '@/features/inventory/components/InventoryPage';
import { BrandsPage } from '@/features/inventory/components/BrandsPage';
import { CategoriesPage } from '@/features/inventory/components/CategoriesPage';
import { LocationsPage } from '@/features/inventory/components/LocationsPage';
import { ProductDetailPage } from '@/features/inventory/components/ProductDetailPage';
import { CustomersPage } from '@/features/customers/components/CustomersPage';
import { OrdersPage } from '@/features/orders/components/OrdersPage';
import { CounterOrdersPage } from '@/features/counter/components/CounterOrdersPage';
import { UsersPage } from '@/features/users/components/UsersPage';
import { SalesHomePage } from '@/features/sales/components/SalesHomePage';
import { SalesScanPage } from '@/features/sales/components/SalesScanPage';
import { SalesProductPage } from '@/features/sales/components/SalesProductPage';
import { SalesCartPage } from '@/features/sales/components/SalesCartPage';
import { SalesPendingPage } from '@/features/sales/components/SalesPendingPage';

export default function App() {
    return (
        <Routes>
            {/* ── Public routes ───────────────────────────────── */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pin-login" element={<PinLoginPage />} />
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
                <Route path="inventory/brands" element={<BrandsPage />} />
                <Route path="inventory/categories" element={<CategoriesPage />} />
                <Route path="inventory/locations" element={<LocationsPage />} />
                <Route path="inventory/products/:id" element={<ProductDetailPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="users" element={<UsersPage />} />
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
                <Route index element={<CounterOrdersPage />} />
            </Route>

            {/* ── Salesman routes ───────────────────────────────── */}
            <Route
                path="/sales"
                element={
                    <ProtectedRoute allowedRoles={['salesman']}>
                        <SalesLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<SalesHomePage />} />
                <Route path="home" element={<SalesHomePage />} />
                <Route path="scan" element={<SalesScanPage />} />
                <Route path="product/:variantId" element={<SalesProductPage />} />
                <Route path="cart" element={<SalesCartPage />} />
                <Route path="pending" element={<SalesPendingPage />} />
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
