import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
}

export const sendResponse = <T>({
  res,
  statusCode = 200,
  message = 'Success',
  data,
}: ApiResponseOptions<T>) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data: data !== undefined ? data : null,
  });
};
