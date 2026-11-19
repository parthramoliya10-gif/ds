export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors?: any[];
    constructor(statusCode: number, message?: string, errors?: any[], isOperational?: boolean, stack?: string);
}
