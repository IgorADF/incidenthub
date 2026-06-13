import { Prisma } from "../db/generated/client";

export type Organization = Prisma.OrganizationGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;
