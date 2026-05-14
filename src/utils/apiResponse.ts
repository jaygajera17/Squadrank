import { Response } from 'express';

interface ApiError {
  code: string;
  details?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiError | null;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
};

export const sendError = (
  res: Response,
  message = 'Internal Server Error',
  statusCode = 500,
  code = 'INTERNAL_SERVER_ERROR',
  details?: string,
): Response<ApiResponse<never>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      code,
      ...(details !== undefined && { details }),
    },
  });
};
