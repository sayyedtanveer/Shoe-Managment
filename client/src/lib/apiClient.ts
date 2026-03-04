import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
});

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: AxiosError | null, token: string | null = null) {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const state = useAuthStore.getState();
                const { data } = await apiClient.post<{ data: { accessToken: string; refreshToken: string } }>('/auth/refresh', {
                    clientType: state.authMode,
                    refreshToken: state.authMode === 'mobile' ? state.refreshToken : undefined,
                });
                const { accessToken, refreshToken } = data.data;

                const { user, authMode } = useAuthStore.getState();
                if (user) {
                    useAuthStore.getState().setAuth(user, accessToken, refreshToken, authMode);
                }

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                processQueue(null, accessToken);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
