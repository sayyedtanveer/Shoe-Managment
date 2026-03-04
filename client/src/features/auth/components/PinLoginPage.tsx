import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { Store, Loader2 } from 'lucide-react';

export function PinLoginPage() {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { data } = await apiClient.post('/auth/pin-login', {
                username,
                pin,
                clientType: 'mobile',
            });
            const { user, accessToken, refreshToken } = data.data;
            setAuth(user, accessToken, refreshToken, 'mobile');

            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'inventory_manager') navigate('/admin/inventory');
            else if (user.role === 'salesman') navigate('/salesman');
            else if (user.role === 'cashier') navigate('/counter');
            else navigate('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'PIN login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const appendDigit = (d: string) => {
        if (pin.length >= 6) return;
        setPin((prev) => prev + d);
    };

    const backspace = () => setPin((prev) => prev.slice(0, -1));

    return (
        <div className="space-y-6">
            <div className="text-center mb-2 text-white">
                <div className="inline-flex items-center justify-center p-3 bg-teal-500 rounded-full mb-3 shadow-lg shadow-teal-500/30">
                    <Store className="w-8 h-8 text-neutral-900" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Quick PIN Login</h2>
                <p className="text-neutral-400 text-sm">For mobile / kiosk users</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl font-medium">
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
                        className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200"
                        placeholder="Enter your username"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        PIN
                    </label>
                    <div className="flex justify-center gap-2 mb-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-neutral-600 flex items-center justify-center"
                            >
                                {pin[idx] && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {['1','2','3','4','5','6','7','8','9'].map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => appendDigit(d)}
                                className="py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-lg font-semibold"
                            >
                                {d}
                            </button>
                        ))}
                        <span />
                        <button
                            type="button"
                            onClick={() => appendDigit('0')}
                            className="py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-lg font-semibold"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={backspace}
                            className="py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium"
                        >
                            Del
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || pin.length < 4}
                    className="w-full bg-teal-500 hover:bg-teal-400 text-neutral-900 font-bold rounded-xl px-4 py-3.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In with PIN'}
                </button>
            </form>
        </div>
    );
}

