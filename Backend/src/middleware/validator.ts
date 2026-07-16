import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path as (string | number)[],
          message: issue.message,
          code: issue.code,
        }));
        next(new AppError('Validation failed', 400, true, errors));
      } else {
        next(error);
      }
    }
  };
};
