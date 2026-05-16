import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Reads the result of express-validator checks that were run before this
 * middleware and returns a 422 response when validation errors are present.
 */
const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    const normalizeMessage = (
      msg: unknown,
    ): {
      message: string;
      code: string;
      details?: string;
      statusCode?: number;
    } => {
      if (msg && typeof msg === "object") {
        const messageObject = msg as {
          message?: string;
          code?: string;
          details?: string;
          statusCode?: number;
        };
        return {
          message: messageObject.message ?? "Validation failed",
          code: messageObject.code ?? "VALIDATION_ERROR",
          details: messageObject.details,
          statusCode: messageObject.statusCode,
        };
      }

      if (typeof msg === "string") {
        return {
          message: msg,
          code: "VALIDATION_ERROR",
        };
      }

      return {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
      };
    };

    const primary = normalizeMessage(errorList[0]?.msg);
    const primaryMessage = primary.message;
    const primaryCode = primary.code;
    const detailsFromPrimary = primary.details;
    const primaryStatusCode = primary.statusCode ?? 422;
    const combinedDetails = errorList
      .map((error) => {
        const { message } = normalizeMessage(error.msg);
        const path = "path" in error ? error.path : error.type;
        return `${path}: ${message}`;
      })
      .join("; ");
    res.status(primaryStatusCode).json({
      success: false,
      message: primaryMessage,
      data: null,
      error: {
        code: primaryCode,
        details: detailsFromPrimary ?? combinedDetails,
      },
    });
    return;
  }
  next();
};

export default validateRequest;
