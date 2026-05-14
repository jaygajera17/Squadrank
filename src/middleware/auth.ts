import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
    res.status(401).json({ success: false, message: 'Unauthorized — no token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ success: false, message: 'JWT secret is not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized — invalid or expired token' });
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
      res.status(403).json({
        success: false,
        message: 'Forbidden — you do not have permission to perform this action',
      });
      return;
    }
    next();
  };
