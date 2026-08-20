import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

interface ValidationOptions {
	body?: ZodSchema<any>;
	query?: ZodSchema<any>;
	params?: ZodSchema<any>;
}

export const validateRequest = (schemas: ValidationOptions) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			if (schemas.body) {
				req.body = await schemas.body.parseAsync(req.body);
			}
			if (schemas.query) {
				req.query = await schemas.query.parseAsync(req.query);
			}
			if (schemas.params) {
				req.params = await schemas.params.parseAsync(req.params);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
};
