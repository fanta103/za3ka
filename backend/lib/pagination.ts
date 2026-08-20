import { Request } from "express";

export interface PaginationOptions {
	cursor?: string;
	limit?: number;
}

export interface PaginatedResult<T> {
	data: T[];
	nextCursor: string | null;
	hasMore: boolean;
	total?: number;
}

export const getPaginationParams = (req: Request, defaultLimit: number = 20): { cursor?: string; limit: number } => {
	const rawLimit = Number(req.query.limit);
	const limit = Math.min(Math.max(isNaN(rawLimit) ? defaultLimit : rawLimit, 1), 100);
	const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
	return { cursor, limit };
};

export const formatPaginatedResult = <T extends Record<string, any>>(
	items: T[],
	limit: number,
	cursorField: keyof T = "createdAt"
): PaginatedResult<T> => {
	const hasMore = items.length > limit;
	const data = hasMore ? items.slice(0, limit) : items;

	let nextCursor: string | null = null;
	if (hasMore && data.length > 0) {
		const lastItem = data[data.length - 1];
		const cursorVal = lastItem[cursorField];
		if (cursorVal !== null && cursorVal !== undefined) {
			if (
				Object.prototype.toString.call(cursorVal) === "[object Date]" ||
				(typeof cursorVal === "object" && typeof (cursorVal as any).toISOString === "function")
			) {
				nextCursor = (cursorVal as any).toISOString();
			} else {
				nextCursor = String(cursorVal);
			}
		}
	}

	return {
		data,
		nextCursor,
		hasMore,
	};
};
