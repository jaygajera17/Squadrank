import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Verifies the Bearer JWT token in the Authorization header.
 * Attaches the decoded payload to `req.user` on success.
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Unauthorized — no token provided', 401, 'UNAUTHORIZED_NO_TOKEN');
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    sendError(res, 'JWT secret is not configured', 500, 'JWT_SECRET_NOT_CONFIGURED');
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch {
    sendError(res, 'Unauthorized — invalid or expired token', 401, 'UNAUTHORIZED_INVALID_TOKEN');
  }
};

/**
 * Restricts access to users whose role is in the allowed list.
 * Must be used after `authenticate`.
 */
export const authorize =
  (...roles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(
        res,
        'Forbidden — you do not have permission to perform this action',
        403,
        'FORBIDDEN',
      );
      return;
    }
    next();
  };
