import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: string;
}

const statusCodeToDefaultErrorCode = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_FAILED';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
};

/**
 * Catches requests to undefined routes.
 */
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error: AppError = new Error(`Route not found — ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Central error-handling middleware.
 * Express recognises a 4-argument middleware as an error handler.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';
  const details =
    err.details ?? (process.env.NODE_ENV === 'development' ? err.stack : undefined);
  const code = err.code ?? statusCodeToDefaultErrorCode(statusCode);

  sendError(res, message, statusCode, code, details);
};
