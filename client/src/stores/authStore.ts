import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/apiClient';

export interface AuthUser {
    id: string;
    username: string;
    fullName: string | null;
    role: string;
    shopId: string;
}

export type AuthMode = 'web' | 'mobile';

interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    authMode: AuthMode;
    isAuthenticated: boolean;

    setAuth: (user: AuthUser, accessToken: string, refreshToken?: string | null, authMode?: AuthMode) => void;
    clearAuth: () => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            authMode: 'web',
            isAuthenticated: false,

            setAuth: (user, accessToken, refreshToken = null, authMode = 'web') =>
                set({ user, accessToken, refreshToken, authMode, isAuthenticated: true }),

            clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, authMode: 'web', isAuthenticated: false }),

            logout: async () => {
                try {
                    await apiClient.post('/auth/logout');
                } catch {
                    // Proceed even if server call fails
                }
                get().clearAuth();
            },
        }),
        {
            name: 'shoeflow_auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                authMode: state.authMode,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
