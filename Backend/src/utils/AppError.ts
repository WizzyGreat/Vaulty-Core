export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errors?: Array<{ path: (string | number)[]; message: string; code: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
