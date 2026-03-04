import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * Centered glassmorphism layout for auth pages (login, etc.)
 * If already authenticated, redirects to /dashboard.
 */
export function AuthLayout() {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative gradient blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary-600/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-500/15 blur-[100px] pointer-events-none" />

            {/* Brand watermark */}
            <div className="absolute top-6 left-8 flex items-center gap-2">
                <span className="text-2xl">👟</span>
                <span className="text-xl font-bold gradient-text">ShoeFlow</span>
            </div>

            {/* Auth card */}
            <div className="relative w-full max-w-md">
                <div className="glass p-8 shadow-glow-primary animate-fade-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
