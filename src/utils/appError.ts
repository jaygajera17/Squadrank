export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: string;
  public readonly isOperational: boolean; // distinguishes expected vs unexpected errors

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    details?: string,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}