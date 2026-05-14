import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so that any thrown error is forwarded to
 * Express's next(err) error handler — removes the need for try/catch in
 * every controller method.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
