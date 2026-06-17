import { Prisma, PrismaClient } from "@infra/db/generated";

export type TPrismaClient = PrismaClient | Prisma.TransactionClient;
