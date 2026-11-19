import { Response } from 'express';
export interface ApiResponseOptions<T> {
    res: Response;
    statusCode?: number;
    message?: string;
    data?: T;
}
export declare const sendResponse: <T>({ res, statusCode, message, data, }: ApiResponseOptions<T>) => Response<any, Record<string, any>>;
