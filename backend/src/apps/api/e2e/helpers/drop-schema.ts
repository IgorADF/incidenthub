import { MyPrismaClient } from "@infra/db/prisma-client";

export async function dropSchema(prismaClient: MyPrismaClient, schemaName: string) {
    try {
        await prismaClient.$executeRawUnsafe(
            `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
        );
    } catch (error) {
        throw new Error(
            `Error dropping test database schema ${schemaName}: ${(error as Error).message
            }`,
        );
    }
}
