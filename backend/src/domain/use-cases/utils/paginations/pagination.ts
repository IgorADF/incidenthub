import z from "zod";

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const LimitPagination = z
	.number()
	.int()
	.min(1)
	.max(MAX_PAGE_LIMIT)
	.default(DEFAULT_PAGE_LIMIT);
