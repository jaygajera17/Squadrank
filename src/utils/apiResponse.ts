import { Response } from "express";

interface ErrorInfo {
  code: string;
  details?: string;
}

interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  error: ErrorInfo | null;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
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
  message = "Internal Server Error",
  statusCode = 500,
  errorCode = "INTERNAL_SERVER_ERROR",
  details?: string,
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      code: errorCode,
      ...(details && { details }),
    },
  });
};
