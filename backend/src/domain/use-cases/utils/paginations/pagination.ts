import { UUIDv7 } from "@domain/value-objects/uuidv7";
import z from "zod";

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const LimitPagination = z
	.number()
	.int()
	.min(1)
	.max(MAX_PAGE_LIMIT)
	.default(DEFAULT_PAGE_LIMIT);

export const ListCursor = z.object({
	id: UUIDv7.nullable(),
});

export const ListPagination = z.object({
	limit: LimitPagination,
	cursor: ListCursor,
});

export const NextPaginationList = z.object({
	limit: LimitPagination,
	hasNextPage: z.boolean(),
	nextCursor: ListCursor,
});

export type ListCursorType = z.infer<typeof ListCursor>;

export type ListPaginationType = z.infer<typeof ListPagination>;

export type NextPaginationListType = z.infer<typeof NextPaginationList>;
