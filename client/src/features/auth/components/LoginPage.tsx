import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { apiClient } from '../../../lib/apiClient';
import { Eye, EyeOff, Store, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/auth/login', {
                username,
                password,
                clientType: 'web',
            });

            const { user, accessToken, refreshToken } = response.data.data;
            setAuth(user, accessToken, refreshToken, 'web');

            if (!rememberMe) {
                // Hint for future: clear auth on next load if not remembered
                sessionStorage.setItem('shoeflow_skip_remember', '1');
            } else {
                sessionStorage.removeItem('shoeflow_skip_remember');
            }

            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'inventory_manager') navigate('/admin/inventory');
            else if (user.role === 'salesman') navigate('/salesman');
            else if (user.role === 'cashier') navigate('/counter');
            else navigate('/');

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10 text-white">
                    <div className="inline-flex items-center justify-center p-4 bg-teal-500 rounded-full mb-4 shadow-lg shadow-teal-500/30">
                        <Store className="w-10 h-10 text-neutral-900" />
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2">ShoeFlow</h2>
                    <p className="text-neutral-400 font-medium">Sign in to your shop workspace</p>
                </div>

                <div className="bg-neutral-800 rounded-3xl p-8 shadow-2xl border border-neutral-700/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-4 rounded-xl font-medium animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="inline-flex items-center gap-2 text-neutral-300">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded border-neutral-600 bg-neutral-900 text-teal-500 focus:ring-teal-500/60"
                                />
                                <span>Remember me</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200 pr-12"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-neutral-900 font-bold rounded-xl px-4 py-3.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4 hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-neutral-500 text-sm mt-8 font-medium">
                    &copy; 2026 ShoeFlow Inc. All rights reserved.
                </p>
            </div>
        </div>
    );
}
