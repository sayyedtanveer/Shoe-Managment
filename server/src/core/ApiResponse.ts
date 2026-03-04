import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    message: string;
    data: T;
    meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: unknown[];
    stack?: string;
}

/**
 * Send a standardised success response.
 */
export function sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: Record<string, unknown>
): Response {
    const body: ApiSuccessResponse<T> = {
        success: true,
        message,
        data,
        ...(meta && { meta }),
    };
    return res.status(statusCode).json(body);
}

/**
 * Send a standardised error response.
 */
export function sendError(
    res: Response,
    message = 'Something went wrong',
    statusCode = 500,
    errors?: unknown[]
): Response {
    const body: ApiErrorResponse = {
        success: false,
        message,
        ...(errors && { errors }),
    };
    return res.status(statusCode).json(body);
}
