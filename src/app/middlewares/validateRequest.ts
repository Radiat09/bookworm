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
        // Don't reassign req.query - just validate it
        await zodSchema.parseAsync(req.query);
        // The parsed result is returned, but we don't need to reassign
      }

      if (options.validateParams) {
        // Don't reassign req.params - just validate it
        await zodSchema.parseAsync(req.params);
        // The parsed result is returned, but we don't need to reassign
      }

      next();
    } catch (error) {
      next(error);
    }
  };

// Alternative: Create separate middlewares
export const validateBody = (zodSchema: ZodSchema) =>
  validateRequest(zodSchema, { validateBody: true });

export const validateQuery = (zodSchema: ZodSchema) =>
  validateRequest(zodSchema, { validateQuery: true });

export const validateParams = (zodSchema: ZodSchema) =>
  validateRequest(zodSchema, { validateParams: true });
