import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
interface RequestValidationSchema {
    body?: ZodTypeAny;
    query?: ZodTypeAny;
    params?: ZodTypeAny;
}
export declare const validateRequest: (schema: RequestValidationSchema) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export {};
