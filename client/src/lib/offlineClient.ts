import { AxiosError } from 'axios';
import { apiClient } from '@/lib/apiClient';

export async function enqueueOfflineOperation(
    operationType: string,
    data: Record<string, unknown>
): Promise<void> {
    try {
        await apiClient.post('/offline', { operationType, data });
    } catch {
        // Fire-and-forget; if this fails we just drop the offline hint.
    }
}

export function isNetworkError(error: unknown): boolean {
    const err = error as AxiosError | undefined;
    return !!err && !err.response;
}

