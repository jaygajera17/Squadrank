import { sendError } from "../utils/apiResponse";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Known, expected errors thrown from services
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // MongoDB duplicate key (shouldn't reach here normally, but safety net)
  if (isMongoError(err) && err.code === 11000) {
    sendError(res, "Duplicate entry", 409, "DUPLICATE_KEY");
    return;
  }

  // Unknown/unexpected errors — don't leak internals
  console.error("[Unhandled Error]", err);
  sendError(res, "Internal Server Error", 500, "INTERNAL_SERVER_ERROR");
}

function isMongoError(err: unknown): err is { code: number; message: string } {
  return typeof err === "object" && err !== null && "code" in err;
}