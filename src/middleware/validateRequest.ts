import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse';

/**
 * Reads the result of express-validator checks that were run before this
 * middleware and returns a 422 response when validation errors are present.
 */
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors
      .array()
      .map((error) => `${error.type === 'field' ? error.path : 'request'}: ${error.msg}`)
      .join('; ');
    sendError(res, 'Validation failed', 422, 'VALIDATION_FAILED', details);
    return;
  }
  next();
};

export default validateRequest;
