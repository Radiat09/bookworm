import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidationOptions {
  validateBody?: boolean;
  validateQuery?: boolean;
  validateParams?: boolean;
}

export const validateRequest =
  (zodSchema: ZodSchema, options: ValidationOptions = { validateBody: true }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Handle different validation types
      if (options.validateBody) {
        // Parse request body data if it's in data field
        if (req.body.data) {
          req.body = JSON.parse(req.body.data);
        }

        req.body = await zodSchema.parseAsync(req.body);
      }

      if (options.validateQuery) {
        req.query = await zodSchema.parseAsync(req.query);
      }

      if (options.validateParams) {
        req.params = await zodSchema.parseAsync(req.params);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
