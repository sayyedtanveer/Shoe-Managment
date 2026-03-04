/**
 * ApiError – Operational error base class.
 * Only throw ApiError subclasses for known, expected errors.
 * Unexpected errors bubble up as 500s through the global error handler.
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly errors?: unknown[];

    constructor(
        statusCode: number,
        message: string,
        isOperational = true,
        errors?: unknown[]
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        // Restore prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request', errors?: unknown[]) {
        super(400, message, true, errors);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

export class ConflictError extends ApiError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}

export class UnprocessableError extends ApiError {
    constructor(message = 'Unprocessable Entity', errors?: unknown[]) {
        super(422, message, true, errors);
    }
}

export class InternalError extends ApiError {
    constructor(message = 'Internal Server Error') {
        super(500, message, false);
    }
}
