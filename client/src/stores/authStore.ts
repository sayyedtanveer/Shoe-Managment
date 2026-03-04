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

interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;

    setAuth: (user: AuthUser, accessToken: string) => void;
    clearAuth: () => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            setAuth: (user, accessToken) =>
                set({ user, accessToken, isAuthenticated: true }),

            login: (user, accessToken) =>
                set({ user, accessToken, isAuthenticated: true }),

            clearAuth: () =>
                set({ user: null, accessToken: null, isAuthenticated: false }),

            logout: async () => {
                try {
                    await apiClient.post('/auth/logout');
                } catch {
                    // Proceed even if server call fails
                }
                set({ user: null, accessToken: null, isAuthenticated: false });
            },
        }),
        {
            name: 'shoeflow_auth',    // localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
