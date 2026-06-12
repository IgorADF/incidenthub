import { Prisma, PrismaClient } from "../db/generated/client";

export type TPrismaClient = PrismaClient | Prisma.TransactionClient;
