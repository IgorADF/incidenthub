import { NormalizedString } from "@domain/value-objects/normalized-string";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import z from "zod";
import { LimitPagination } from "./pagination";

export const ListUserCursor = z.object({
	normalizedName: NormalizedString.nullable(),
	id: UUIDv7.nullable()
})

export const ListUserPagination = z.object({
	limit: LimitPagination,
	cursor: ListUserCursor
})

export const NextPaginationListUser = z.object({
	limit: LimitPagination,
	hasNextPage: z.boolean(),
	nextCursor: ListUserCursor
})

export type ListUserCursorType = z.infer<typeof ListUserCursor>;

export type ListUserPaginationType = z.infer<typeof ListUserPagination>;

export type NextPaginationListUserType = z.infer<typeof NextPaginationListUser>;